import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { getPrismaClient } from '@/lib/prisma';
import { verifyFlwTransaction } from '@/lib/sabiFlutterwave';

const prisma = getPrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await getSabiSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transactionId, status } = await req.json();

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });
    }

    // Verify payment with Flutterwave
    const verification = await verifyFlwTransaction(transactionId);

    if (!verification.success) {
      return NextResponse.json(
        { error: 'Payment verification failed', success: false },
        { status: 400 }
      );
    }

    // Check if payment was successful
    if (verification.status !== 'successful') {
      return NextResponse.json(
        { error: `Payment ${verification.status}`, success: false },
        { status: 400 }
      );
    }

    const amountInKobo = verification.amount || 0;

    if (amountInKobo <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount', success: false },
        { status: 400 }
      );
    }

    // Get or create wallet
    let wallet = await prisma.sabiWallet.findUnique({
      where: { userId: session.id },
    });

    if (!wallet) {
      wallet = await prisma.sabiWallet.create({
        data: {
          userId: session.id,
          balance: 0,
          totalFunded: 0,
          totalSpent: 0,
          totalRefunded: 0,
        },
      });
    }

    // Add funds to wallet
    const newBalance = wallet.balance + amountInKobo;

    const updatedWallet = await prisma.sabiWallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        totalFunded: wallet.totalFunded + amountInKobo,
      },
    });

    // Log transaction
    await prisma.sabiTransaction.create({
      data: {
        userId: session.id,
        type: 'fund',
        amount: amountInKobo,
        reference: transactionId,
        description: `Wallet funded via Flutterwave`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and wallet credited',
      amount: amountInKobo,
      newBalance: updatedWallet.balance,
    });
  } catch (error) {
    console.error('[WALLET CALLBACK] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment callback', success: false },
      { status: 500 }
    );
  }
}
