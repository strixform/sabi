/**
 * Self-service recovery for dedicated-account transfers.
 * POST /api/sabi/wallet/virtual-account/reconcile
 *
 * Pulls the caller's successful transactions from Flutterwave and credits any
 * bank-transfer inflow to their dedicated account that the webhook didn't. Safe
 * to call repeatedly — crediting is idempotent per Flutterwave transaction id.
 */
import { NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { reconcileVirtualAccount } from '@/lib/sabiVirtualAccount';

export const preferredRegion = 'sfo1';
export const maxDuration = 25;

export async function POST() {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await reconcileVirtualAccount(session.id, session.email);
  return NextResponse.json({ success: true, ...res });
}
