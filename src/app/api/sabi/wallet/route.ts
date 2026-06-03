import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { getSabiWallet, getSabiTransactions } from '@/lib/sabiWallet';

export async function GET(req: NextRequest) {
  try {
    const session = await getSabiSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const wallet = await getSabiWallet(session.id);
    const transactions = await getSabiTransactions(session.id, 20);

    return NextResponse.json({
      success: true,
      wallet,
      transactions,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
