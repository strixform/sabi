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
      return NextResponse.json({ error: 'Invalid tx_ref format' }, { status: 400 });
    }

    const userId = userIdMatch[1];
    const amountInKobo = Math.round(webhook.data.amount * 100);

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
