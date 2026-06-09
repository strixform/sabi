import { NextRequest, NextResponse } from 'next/server';
import { verifyFlwWebhookSignature, verifyFlwTransaction } from '@/lib/owletFlutterwave';
import { creditOwletWallet } from '@/lib/owletWallet';
import { prisma } from '@/lib/prisma';

export const maxDuration = 15;
export const preferredRegion = 'sfo1'; // Turso DB in Oregon (sfo1) — keeps latency minimal

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('verif-hash');

    if (!signature) {
      return NextResponse.json(
        { error: 'Signature missing' },
        { status: 400 }
      );
    }

    const body = await req.text();

    // Verify webhook signature
    if (!verifyFlwWebhookSignature(body, signature)) {
      console.warn('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(body);

    // Only process successful charges
    if (payload.event !== 'charge.completed' || payload.data.status !== 'successful') {
      console.log('Skipping non-successful event:', payload.event, payload.data.status);
      return NextResponse.json({ success: true });
    }

    const txRef = payload.data.tx_ref;
    const amountInKobo = Math.round(payload.data.amount * 100);
    const email = payload.data.customer.email;

    // Find user by email
    const user = await prisma.sabiUser.findUnique({
      where: { email },
    });

    if (!user) {
      console.error('User not found for email:', email);
      return NextResponse.json(
        { success: true }, // Still return 200 to prevent webhook retry
        { status: 200 }
      );
    }

    // Verify transaction with Flutterwave
    const verifyResult = await verifyFlwTransaction(txRef);

    if (!verifyResult.success) {
      console.error('Transaction verification failed:', verifyResult.error);
      return NextResponse.json(
        { success: true },
        { status: 200 }
      );
    }

    // Credit wallet atomically
    const creditResult = await creditOwletWallet(user.id, amountInKobo, txRef);

    if (!creditResult.success) {
      console.error('Wallet credit failed:', creditResult.error);
      return NextResponse.json(
        { success: true },
        { status: 200 }
      );
    }

    console.log(`Wallet credited: User ${user.id}, Amount â‚¦${amountInKobo / 100}, Ref ${txRef}`);

    return NextResponse.json({
      success: true,
      message: 'Webhook processed',
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 to prevent retry, but log the error
    return NextResponse.json(
      { success: true, error: 'Processing error (logged)' },
      { status: 200 }
    );
  }
}