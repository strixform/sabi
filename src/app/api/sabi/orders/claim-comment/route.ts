import { NextRequest, NextResponse } from 'next/server';
import { sabiExecute } from '@/lib/tursoClient';

export const maxDuration = 20;
export const preferredRegion = 'sfo1';

/**
 * Token-gated: allocate ONE custom comment to a tasker for a custom-comment order.
 * Called by gamerz360 when a tasker starts the job. Atomic + idempotent:
 *  • each comment (idx) is claimed by exactly one tasker — a UNIQUE(orderId, idx)
 *    constraint makes concurrent claims race-safe (loser retries the next idx);
 *  • a tasker who already claimed for this order gets the SAME comment back.
 *
 * POST { sabiOrderId, taskerId } → { custom, comment, idx } | { custom:false } | { soldOut:true }
 */
let ready = false;
async function ensure() {
  if (ready) return;
  await sabiExecute({ sql: `CREATE TABLE IF NOT EXISTS "CustomCommentClaim" (
    "sabiOrderId" TEXT NOT NULL, "idx" INTEGER NOT NULL, "taskerId" TEXT NOT NULL,
    "claimedAt" TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY ("sabiOrderId","idx"))`, args: [] }).catch(() => {});
  await sabiExecute({ sql: `CREATE INDEX IF NOT EXISTS "idx_ccc_tasker" ON "CustomCommentClaim" ("sabiOrderId","taskerId")`, args: [] }).catch(() => {});
  ready = true;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ') || auth.substring(7) !== process.env.SABI_INTEGRATION_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const sabiOrderId = String(body.sabiOrderId || '');
  const taskerId = String(body.taskerId || '');
  if (!sabiOrderId || !taskerId) return NextResponse.json({ error: 'sabiOrderId and taskerId required' }, { status: 400 });

  await ensure();

  // Load the order's custom comments (guarded column).
  let comments: string[] = [];
  try {
    const r = await sabiExecute({ sql: `SELECT customComments FROM SabiOrder WHERE id = ? LIMIT 1`, args: [sabiOrderId] });
    const raw = (r.rows[0] as any)?.customComments;
    if (raw) { const p = JSON.parse(String(raw)); if (Array.isArray(p)) comments = p.map(String); }
  } catch {}
  if (comments.length === 0) return NextResponse.json({ custom: false });

  // Already claimed by this tasker? Return the same comment (idempotent).
  const existing = await sabiExecute({ sql: `SELECT idx FROM CustomCommentClaim WHERE sabiOrderId = ? AND taskerId = ? LIMIT 1`, args: [sabiOrderId, taskerId] });
  if (existing.rows.length > 0) {
    const idx = Number((existing.rows[0] as any).idx);
    return NextResponse.json({ custom: true, idx, comment: comments[idx] ?? null });
  }

  // Claim the next free idx. UNIQUE(orderId, idx) means a concurrent claim on the
  // same idx fails → we just try the next one. Loop until we win or run out.
  const taken = await sabiExecute({ sql: `SELECT idx FROM CustomCommentClaim WHERE sabiOrderId = ?`, args: [sabiOrderId] });
  const takenSet = new Set((taken.rows as any[]).map(r => Number(r.idx)));
  for (let idx = 0; idx < comments.length; idx++) {
    if (takenSet.has(idx)) continue;
    try {
      const ins = await sabiExecute({ sql: `INSERT INTO CustomCommentClaim (sabiOrderId, idx, taskerId) VALUES (?, ?, ?)`, args: [sabiOrderId, idx, taskerId] });
      if (Number((ins as any).rowsAffected || 0) > 0) {
        return NextResponse.json({ custom: true, idx, comment: comments[idx] });
      }
    } catch { /* idx taken by a concurrent claim — try the next */ }
  }
  // Every comment is already allocated.
  return NextResponse.json({ custom: true, soldOut: true, comment: null });
}
