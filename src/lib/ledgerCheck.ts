import { sabiExecute } from './tursoClient';

export type RefundOffender = {
  orderId: string;
  userId: string;
  email: string | null;
  refundRows: number;
  totalRefundedNaira: number;
  extraRefundedNaira: number; // over-credit beyond a single legit refund
  firstAt: any;
  lastAt: any;
};

export type LedgerCheckResult = {
  suspiciousCount: number;
  totalExtraRefundNaira: number;
  offenders: RefundOffender[];
};

/**
 * Find orders refunded more than once — the double-refund fingerprint.
 *
 * Every refund now writes exactly ONE `type='refund'` SabiTransaction row per order
 * (gated behind a winning status transition), so a legit order can be refunded at most
 * once. Any order with >1 refund row is a double-refund. Shared by the on-demand admin
 * endpoint and the daily cron tripwire.
 */
export async function findDoubleRefunds(): Promise<LedgerCheckResult> {
  const r = await sabiExecute({
    sql: `
      SELECT t.orderId,
             MAX(t.userId)    AS userId,
             COUNT(*)         AS refunds,
             SUM(t.amount)    AS totalRefundKobo,
             MAX(t.amount)    AS maxRefundKobo,
             MIN(t.createdAt) AS firstAt,
             MAX(t.createdAt) AS lastAt
      FROM SabiTransaction t
      WHERE t.type = 'refund' AND t.orderId IS NOT NULL AND t.orderId != ''
      GROUP BY t.orderId
      HAVING COUNT(*) > 1
      ORDER BY (SUM(t.amount) - MAX(t.amount)) DESC
      LIMIT 1000`,
    args: [],
  }).catch(() => ({ rows: [] as any[] }));

  const rows = r.rows as any[];

  // Best-effort email lookup for the affected users.
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

  const offenders: RefundOffender[] = rows.map((x) => {
    const total = Number(x.totalRefundKobo || 0);
    const max = Number(x.maxRefundKobo || 0);
    return {
      orderId: String(x.orderId),
      userId: String(x.userId),
      email: emailById[String(x.userId)] || null,
      refundRows: Number(x.refunds || 0),
      totalRefundedNaira: Math.round(total / 100),
      extraRefundedNaira: Math.round((total - max) / 100),
      firstAt: x.firstAt,
      lastAt: x.lastAt,
    };
  });

  const totalExtraRefundKobo = rows.reduce(
    (s, x) => s + (Number(x.totalRefundKobo || 0) - Number(x.maxRefundKobo || 0)),
    0
  );

  return {
    suspiciousCount: offenders.length,
    totalExtraRefundNaira: Math.round(totalExtraRefundKobo / 100),
    offenders,
  };
}
