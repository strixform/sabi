import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { getSabiWallet, getSabiTransactions } from '@/lib/sabiWallet';

export async function GET(req: NextRequest) {
  try {
    const session = await getSabiSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch wallet data directly (no Redis caching for faster response)
    const wallet = await getSabiWallet(session.id);
    const transactions = await getSabiTransactions(session.id, 20);

    const data = {
      balance: wallet?.balance || 0,
      totalFunded: wallet?.totalFunded || 0,
      totalSpent: wallet?.totalSpent || 0,
      totalRefunded: wallet?.totalRefunded || 0,
      transactions,
    };

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error('Wallet API error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
  }
}
