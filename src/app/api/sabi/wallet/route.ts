/**
 * SABI Wallet endpoint
 * GET /api/sabi/wallet
 *
 * Performance: wallet + transactions fetched in parallel (was sequential).
 * Wallet balance cached in Redis for 60s — invalidated on any deposit/spend.
 * Session validated via Redis-first getSabiSession() (~5ms cache hit).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { resolveSabiCaller, apiRateLimit } from '@/lib/sabiApiAuth';
import { rateLimitResponse } from '@/lib/rateLimit';
import { getSabiWallet, getSabiTransactions } from '@/lib/sabiWallet';
import { getCachedWallet, setCachedWallet } from '@/lib/redis';
import { getActingAccount } from '@/lib/sabiTeam';

export const preferredRegion = 'sfo1';
export const maxDuration = 10;

export async function GET(req: NextRequest) {
  try {
    const session = await resolveSabiCaller(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const arl = await apiRateLimit(session, 'read', 120, 60000);
    if (!arl.allowed) return rateLimitResponse(120, arl.resetTime);

    // When acting inside a workspace, show that account's wallet (members spend it).
    const acct = await getActingAccount(session.id);

    // Fetch wallet + transactions in parallel — was sequential (2× DB roundtrip cost)
    const [wallet, transactions] = await Promise.all([
      getSabiWallet(acct.accountId),
      getSabiTransactions(acct.accountId, 20),
    ]);

    const data = {
      balance:       wallet?.balance       || 0,
      totalFunded:   wallet?.totalFunded   || 0,
      totalSpent:    wallet?.totalSpent    || 0,
      totalRefunded: wallet?.totalRefunded || 0,
      transactions,
    };

    const response = NextResponse.json({ success: true, ...data });
    // Allow client to serve from cache for 30s before revalidating
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    return response;
  } catch (error) {
    console.error('Wallet API error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
  }
}
