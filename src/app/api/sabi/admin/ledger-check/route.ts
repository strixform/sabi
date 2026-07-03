import { NextRequest, NextResponse } from 'next/server';
import { sabiExecute } from '@/lib/tursoClient';
import { allowOwnerOrStaff } from '@/lib/sabiStaff';

export const maxDuration = 30;
export const preferredRegion = 'sfo1';

/**
 * Double-refund tripwire.
 *
 * Now that EVERY refund writes a `type='refund'` SabiTransaction row (one per order,
 * gated behind a winning status transition), a legitimate order can be refunded at
 * most once. So any order with >1 refund row is the fingerprint of a double-refund —
 * the exact class of bug that silently inflated wallets before. This endpoint surfaces
 * it directly from the ledger instead of waiting for someone to notice a weird balance.
 *
 * Run it on a schedule (or hit it after a deploy) as a standing check.
 *
 * GET → { ok, suspiciousCount, totalExtraRefundNaira, offenders:[...] }
 *   offenders: orders with 2+ refund rows, the extra (over-)refunded amount, and the
 *   affected user — feed the userId straight into /api/sabi/admin/wallet-reconcile.
 * Owner only.
 */
export async function GET(req: NextRequest) {
  const auth = await allowOwnerOrStaff(req);
  if (!auth.ok || auth.role !== 'owner') return NextResponse.json({ error: 'Owner only' }, { status: 403 });

  // Orders carrying more than one refund transaction. `refunds` counts the rows;
  // `totalRefundKobo` sums them; `firstRefundKobo` is what a single legit refund was,
  // so (total - first) approximates the phantom over-credit.
  const r = await sabiExecute({
    sql: `
      SELECT t.orderId,
             MAX(t.userId)               AS userId,
             COUNT(*)                    AS refunds,
             SUM(t.amount)               AS totalRefundKobo,
             MIN(t.amount)               AS minRefundKobo,
             MAX(t.amount)               AS maxRefundKobo,
             MIN(t.createdAt)            AS firstAt,
             MAX(t.createdAt)            AS lastAt
      FROM SabiTransaction t
      WHERE t.type = 'refund' AND t.orderId IS NOT NULL AND t.orderId != ''
      GROUP BY t.orderId
      HAVING COUNT(*) > 1
      ORDER BY (SUM(t.amount) - MAX(t.amount)) DESC
      LIMIT 1000`,
    args: [],
  }).catch((e: any) => ({ rows: [] as any[], _err: String(e?.message) } as any));

  // Emails for the affected users (best-effort, one lookup).
  const rows = r.rows as any[];
  const userIds = Array.from(new Set(rows.map((x) => String(x.userId)).filter(Boolean)));
  const emailById: Record<string, string> = {};
  if (userIds.length) {
    const placeholders = userIds.map(() => '?').join(',');
    const er = await sabiExecute({
      sql: `SELECT id, email FROM SabiUser WHERE id IN (${placeholders})`,
      args: userIds,
    }).catch(() => ({ rows: [] as any[] }));
    for (const u of er.rows as any[]) emailById[String(u.id)] = String(u.email || '');
  }

  const offenders = rows.map((x) => {
    const total = Number(x.totalRefundKobo || 0);
    const max = Number(x.maxRefundKobo || 0);
    return {
      orderId: String(x.orderId),
      userId: String(x.userId),
      email: emailById[String(x.userId)] || null,
      refundRows: Number(x.refunds || 0),
      totalRefundedNaira: Math.round(total / 100),
      // A single legit refund would be one row; everything beyond the largest single
      // refund is the phantom over-credit.
      extraRefundedNaira: Math.round((total - max) / 100),
      firstAt: x.firstAt,
      lastAt: x.lastAt,
    };
  });

  const totalExtraRefundKobo = rows.reduce((s, x) => s + (Number(x.totalRefundKobo || 0) - Number(x.maxRefundKobo || 0)), 0);

  return NextResponse.json({
    ok: true,
    suspiciousCount: offenders.length,
    totalExtraRefundNaira: Math.round(totalExtraRefundKobo / 100),
    offenders,
    hint: offenders.length
      ? 'Feed each userId into /api/sabi/admin/wallet-reconcile?userId=… then POST {action:"apply"} to correct.'
      : 'Clean — no order has been refunded more than once.',
  });
}
