import { NextRequest, NextResponse } from 'next/server';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
import { sabiExecute } from '@/lib/tursoClient';
import { creditSabiWallet } from '@/lib/sabiWallet';

export const maxDuration = 30;
export const preferredRegion = 'sfo1';

/**
 * Org-wide reconciliation for the "charged but order didn't reflect" bug.
 *
 * When checkout debited the wallet but the order row failed to write (and the
 * auto-refund also failed), the buyer is charged with no order and no refund.
 * Per user:
 *   unaccounted = max(0, totalSpent − Σ(order charges) − totalRefunded − engineRefunds)
 *   • totalSpent           — every debit (charge) ever made
 *   • Σ(order charges)     — value of orders that DO exist (any status)
 *   • totalRefunded        — normal 'refund' txns (auto-refunds on failed create, cancellations)
 *   • engineRefunds        — this tool's own 'engine-refund:<userId>' credits (idempotency)
 * Anything left is money taken with no order behind it and not yet returned.
 *
 * GET  → list every affected user + amount (review first).
 * POST { confirm: "REFUND UNACCOUNTED", userId? } → refund one (userId) or ALL listed.
 *   Refund credits via creditSabiWallet with the fixed ref 'engine-refund:<userId>',
 *   which is idempotent (a user can never be engine-refunded twice) and matches the
 *   per-user diagnose-user tool.
 */

const MIN_KOBO = 100; // ignore sub-₦1 rounding noise

const SCAN_SQL = `
  SELECT w.userId AS userId, u.email AS email, u.name AS name,
         w.totalSpent AS totalSpent,
         COALESCE(o.charged, 0) AS charged,
         COALESCE(w.totalRefunded, 0) AS refunded,
         COALESCE(er.eng, 0) AS engineRefunds,
         (w.totalSpent - COALESCE(o.charged,0) - COALESCE(w.totalRefunded,0) - COALESCE(er.eng,0)) AS unaccounted
  FROM SabiWallet w
  JOIN SabiUser u ON u.id = w.userId
  LEFT JOIN (
    SELECT userId, SUM(totalPrice + platformFee - COALESCE(discountAmount,0)) AS charged
    FROM SabiOrder GROUP BY userId
  ) o ON o.userId = w.userId
  LEFT JOIN (
    SELECT userId, SUM(amount) AS eng FROM SabiTransaction
    WHERE type = 'fund' AND reference LIKE 'engine-refund:%' GROUP BY userId
  ) er ON er.userId = w.userId
  WHERE (w.totalSpent - COALESCE(o.charged,0) - COALESCE(w.totalRefunded,0) - COALESCE(er.eng,0)) >= ${MIN_KOBO}
  ORDER BY unaccounted DESC
  LIMIT 500
`;

async function scan() {
  const r = await sabiExecute({ sql: SCAN_SQL, args: [] });
  const rows = (r.rows as any[]).map((x) => ({
    userId: String(x.userId),
    email: x.email,
    name: x.name,
    unaccountedKobo: Number(x.unaccounted || 0),
    unaccountedNaira: Math.round(Number(x.unaccounted || 0) / 100),
    totalSpentNaira: Math.round(Number(x.totalSpent || 0) / 100),
    chargedNaira: Math.round(Number(x.charged || 0) / 100),
    refundedNaira: Math.round(Number(x.refunded || 0) / 100),
  }));
  const totalKobo = rows.reduce((a, x) => a + x.unaccountedKobo, 0);
  return { rows, totalKobo };
}

export async function GET(req: NextRequest) {
  if (!await checkSabiAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  try {
    const { rows, totalKobo } = await scan();
    return NextResponse.json({
      affectedUsers: rows.length,
      totalOwedNaira: Math.round(totalKobo / 100),
      capped: rows.length >= 500,
      users: rows,
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Scan failed', detail: e?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!await checkSabiAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  if (body?.confirm !== 'REFUND UNACCOUNTED') {
    return NextResponse.json({ error: 'Send { "confirm": "REFUND UNACCOUNTED" }' }, { status: 400 });
  }
  const oneUserId = typeof body.userId === 'string' && body.userId.trim() ? body.userId.trim() : null;

  try {
    const { rows } = await scan();
    const targets = oneUserId ? rows.filter((r) => r.userId === oneUserId) : rows;

    let refundedUsers = 0, refundedKobo = 0;
    const failures: string[] = [];
    for (const t of targets) {
      if (t.unaccountedKobo < MIN_KOBO) continue;
      const res = await creditSabiWallet(t.userId, t.unaccountedKobo, `engine-refund:${t.userId}`)
        .catch(() => ({ success: false } as any));
      if (res?.success) { refundedUsers++; refundedKobo += t.unaccountedKobo; }
      else if (failures.length < 20) failures.push(t.email || t.userId);
    }

    return NextResponse.json({
      scope: oneUserId ? 'single' : 'all-affected',
      consideredUsers: targets.length,
      refundedUsers,
      refundedNaira: Math.round(refundedKobo / 100),
      failures,
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Refund run failed', detail: e?.message }, { status: 500 });
  }
}
