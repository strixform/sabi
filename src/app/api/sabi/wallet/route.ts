import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { getSabiWallet, getSabiTransactions } from '@/lib/sabiWallet';
import { getCachedWallet, setCachedWallet } from '@/lib/redis';

export async function GET(req: NextRequest) {
  try {
    const session = await getSabiSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Try cache first (5 minute TTL)
    let cachedData = await getCachedWallet(session.id);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        ...cachedData,
        cached: true,
      });
    }

    const wallet = await getSabiWallet(session.id);
    const transactions = await getSabiTransactions(session.id, 20);

    const data = {
      balance: wallet?.balance || 0,
      totalFunded: wallet?.totalFunded || 0,
      totalSpent: wallet?.totalSpent || 0,
      totalRefunded: wallet?.totalRefunded || 0,
      transactions,
    };

    // Cache for 5 minutes
    await setCachedWallet(session.id, data, 300);

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
