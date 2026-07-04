import { NextRequest, NextResponse } from 'next/server';
import { allowOwnerOrStaff } from '@/lib/sabiStaff';
import { findDoubleRefunds } from '@/lib/ledgerCheck';
import { sabiExecute } from '@/lib/tursoClient';

export const maxDuration = 30;
export const preferredRegion = 'sfo1';

/**
 * Double-refund tripwire (on-demand).
 *
 * Every refund now writes exactly one `type='refund'` SabiTransaction row per order,
 * so any order with >1 refund row is the fingerprint of a double-refund. Surfaces it
 * straight from the ledger. The daily cron (/api/sabi/cron/ledger-check) runs the same
 * check and emails if anything is flagged.
 *
 * GET → { ok, suspiciousCount, totalExtraRefundNaira, offenders:[...] }  (owner only)
 */
export async function GET(req: NextRequest) {
  const auth = await allowOwnerOrStaff(req);
  if (!auth.ok || auth.role !== 'owner') return NextResponse.json({ error: 'Owner only' }, { status: 403 });

  const result = await findDoubleRefunds();

  // ?diagnose=1 → for each offending order, dump its refund rows (description, reference,
  // amount, time) so we can see WHICH code path is refunding it repeatedly.
  if (new URL(req.url).searchParams.get('diagnose') && result.offenders.length) {
    const ids = result.offenders.slice(0, 10).map(o => o.orderId);
    const ph = ids.map(() => '?').join(',');
    const tr = await sabiExecute({
      sql: `SELECT orderId, amount, description, reference, createdAt
            FROM SabiTransaction WHERE type='refund' AND orderId IN (${ph})
            ORDER BY orderId, createdAt ASC`,
      args: ids,
    }).catch(() => ({ rows: [] as any[] }));
    const byOrder: Record<string, any[]> = {};
    for (const t of tr.rows as any[]) {
      (byOrder[String(t.orderId)] ||= []).push({
        amountNaira: Math.round(Number(t.amount || 0) / 100),
        description: t.description || null,
        reference: t.reference || null,
        at: t.createdAt,
      });
    }
    return NextResponse.json({ ok: true, diagnose: true, refundsByOrder: byOrder });
  }

  return NextResponse.json({
    ok: true,
    ...result,
    hint: result.suspiciousCount
      ? 'Balances: wallet-reconcile apply-all. Then POST {action:"resolve"} here to acknowledge these rows so the daily alert stops.'
      : 'Clean — no order has been refunded more than once.',
  });
}

/**
 * POST { action: 'resolve' } — acknowledge the currently-flagged orders (their duplicate
 * refund ROWS stay for audit, but the tripwire stops re-alerting on them). Use after the
 * balances have been corrected via wallet-reconcile. Owner only.
 */
export async function POST(req: NextRequest) {
  const auth = await allowOwnerOrStaff(req);
  if (!auth.ok || auth.role !== 'owner') return NextResponse.json({ error: 'Owner only' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  if (body?.action !== 'resolve') return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  const { offenders } = await findDoubleRefunds();
  if (!offenders.length) return NextResponse.json({ ok: true, resolved: 0 });

  await sabiExecute({ sql: `CREATE TABLE IF NOT EXISTS SabiLedgerResolved (orderId TEXT PRIMARY KEY, resolvedAt TEXT DEFAULT (datetime('now')))`, args: [] }).catch(() => {});
  let resolved = 0;
  for (const o of offenders) {
    const res = await sabiExecute({
      sql: `INSERT OR IGNORE INTO SabiLedgerResolved (orderId) VALUES (?)`,
      args: [o.orderId],
    }).catch(() => ({ rowsAffected: 0 } as any));
    if (Number((res as any).rowsAffected ?? 0) === 1) resolved += 1;
  }
  return NextResponse.json({ ok: true, resolved, orders: offenders.map(o => o.orderId) });
}
