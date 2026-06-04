import { NextRequest, NextResponse } from 'next/server';
import { verifyFlwWebhookSignature, parseFlwWebhook, verifyFlwTransaction } from '@/lib/sabiFlutterwave';
import { creditSabiWallet } from '@/lib/sabiWallet';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('verif-hash') || '';

    if (!verifyFlwWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const webhook = parseFlwWebhook(JSON.parse(body));
    if (!webhook) {
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 });
    }

    if (webhook.event !== 'charge.completed') {
      return NextResponse.json({ success: true });
    }

    const verification = await verifyFlwTransaction(webhook.data.tx_ref);
    if (!verification.success || verification.status !== 'successful') {
      return NextResponse.json({ success: true });
    }

    const txRef = webhook.data.tx_ref;
    const userIdMatch = txRef.match(/^sabi_([a-z0-9]+)_/);
    if (!userIdMatch) {
      console.error('Invalid tx_ref format:', txRef);
      return NextResponse.json({ error: 'Invalid tx_ref format' }, { status: 400 });
    }

    const userId = userIdMatch[1];

    // Verify user exists
    const user = await prisma.sabiUser.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.error('User not found for ID:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 400 });
    }

    // Check for duplicate transaction
    const existingTxn = await prisma.sabiTransaction.findFirst({
      where: {
        userId,
        reference: txRef,
      },
    });

    if (existingTxn) {
      console.log('Duplicate transaction detected:', txRef);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const amountInKobo = Math.round(webhook.data.amount * 100);

    // Validate amount is reasonable (≤ 10M naira)
    if (amountInKobo > 1000000000) {
      console.error('Suspiciously large amount:', webhook.data.amount);
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const creditResult = await creditSabiWallet(userId, amountInKobo, txRef);

    if (!creditResult.success) {
      return NextResponse.json({ error: 'Failed to credit wallet' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
