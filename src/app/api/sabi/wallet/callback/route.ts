import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { getPrismaClient } from '@/lib/prisma';
import { verifyFlwTransaction } from '@/lib/sabiFlutterwave';
import { creditSabiWallet } from '@/lib/sabiWallet';
export const maxDuration = 15;
export const preferredRegion = 'sfo1'; // Turso DB in Oregon (sfo1) — keeps latency minimal


const prisma = getPrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await getSabiSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transactionId, status } = await req.json();

    if (!transactionId) {
      console.error('[WALLET CALLBACK] No transaction ID provided');
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });
    }

    console.log('[WALLET CALLBACK] Verifying transaction:', {
      transactionId,
      status,
      userId: session.id,
    });

    // Verify payment with Flutterwave
    const verification = await verifyFlwTransaction(transactionId);

    console.log('[WALLET CALLBACK] Verification result:', verification);

    if (!verification.success) {
      console.error('[WALLET CALLBACK] Verification failed:', verification.error);
      return NextResponse.json(
        { error: verification.error || 'Payment verification failed', success: false },
        { status: 400 }
      );
    }

    // Check if payment was successful
    if (verification.status !== 'successful') {
      console.error('[WALLET CALLBACK] Payment not successful:', verification.status);
      return NextResponse.json(
        { error: `Payment ${verification.status}`, success: false },
        { status: 400 }
      );
    }

    // Verify the txRef was generated for THIS user (prevent user A claiming user B's payment)
    // Format: sabi_{userId[:8]}_{timestamp}_{random}
    if (verification.txRef) {
      const ownerIdPrefix = session.id.substring(0, 8);
      if (!verification.txRef.startsWith(`sabi_${ownerIdPrefix}_`)) {
        console.error('[WALLET CALLBACK] txRef ownership mismatch', { txRef: verification.txRef, userId: session.id });
        return NextResponse.json({ error: 'Transaction does not belong to this account', success: false }, { status: 403 });
      }
    }

    // Flutterwave returns amount in Naira, convert to Kobo (1 Naira = 100 Kobo)
    const amountInNaira = verification.amount || 0;
    const amountInKobo = Math.round(amountInNaira * 100);

    if (amountInKobo <= 0) {
      console.error('[WALLET CALLBACK] Invalid amount:', { amountInNaira, amountInKobo });
      return NextResponse.json(
        { error: 'Invalid amount', success: false },
        { status: 400 }
      );
    }

    console.log('[WALLET CALLBACK] Amount conversion:', {
      naira: amountInNaira,
      kobo: amountInKobo,
    });

    // Ensure wallet exists before crediting
    const existingWallet = await prisma.sabiWallet.findUnique({ where: { userId: session.id } });
    if (!existingWallet) {
      await prisma.sabiWallet.create({
        data: {
          userId: session.id,
          balance: 0,
          totalFunded: 0,
          totalSpent: 0,
          totalRefunded: 0,
        },
      });
    }

    // Use creditSabiWallet — idempotent, checks for duplicate (userId, type='fund', reference)
    // before crediting, and records the transaction. Prevents double-credit on retry.
    const txRef = verification.txRef || String(transactionId);
    const creditResult = await creditSabiWallet(session.id, amountInKobo, txRef);

    if (!creditResult.success) {
      console.error('[WALLET CALLBACK] Credit failed:', creditResult.error);
      return NextResponse.json(
        { error: creditResult.error || 'Failed to credit wallet', success: false },
        { status: 500 }
      );
    }

    const updatedWallet = await prisma.sabiWallet.findUnique({ where: { userId: session.id } });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and wallet credited',
      amountNaira: amountInNaira,
      amountKobo: amountInKobo,
      newBalanceKobo: updatedWallet?.balance ?? amountInKobo,
      newBalanceNaira: Math.round((updatedWallet?.balance ?? amountInKobo) / 100),
    });
  } catch (error) {
    console.error('[WALLET CALLBACK] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment callback', success: false },
      { status: 500 }
    );
  }
}
