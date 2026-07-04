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
      ? 'Feed each userId into /api/sabi/admin/wallet-reconcile?userId=… then POST {action:"apply"} to correct.'
      : 'Clean — no order has been refunded more than once.',
  });
}
