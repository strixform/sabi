import { NextRequest, NextResponse } from 'next/server';
import { allowOwnerOrStaff } from '@/lib/sabiStaff';
import { findDoubleRefunds } from '@/lib/ledgerCheck';

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
  return NextResponse.json({
    ok: true,
    ...result,
    hint: result.suspiciousCount
      ? 'Feed each userId into /api/sabi/admin/wallet-reconcile?userId=… then POST {action:"apply"} to correct.'
      : 'Clean — no order has been refunded more than once.',
  });
}
