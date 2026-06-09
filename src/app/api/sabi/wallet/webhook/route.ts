import { NextRequest, NextResponse } from 'next/server';
import { verifyFlwWebhookSignature, parseFlwWebhook, verifyFlwTransaction } from '@/lib/sabiFlutterwave';
import { creditSabiWallet } from '@/lib/sabiWallet';
import { prisma } from '@/lib/prisma';
export const maxDuration = 15;
export const preferredRegion = 'sfo1'; // Turso DB in Oregon (sfo1) — keeps latency minimal


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
      // Invalid tx_ref format - silently reject
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const userId = userIdMatch[1];

    // Verify user exists
    const user = await prisma.sabiUser.findUnique({
      where: { id: userId },
    });

    if (!user) {
      // Don't expose user not found - could be user enumeration attack
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Check for duplicate transaction
    const existingTxn = await prisma.sabiTransaction.findFirst({
      where: {
        userId,
        reference: txRef,
      },
    });

    if (existingTxn) {
      // Duplicate - silently accept to prevent replay attack detection
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const amountInKobo = Math.round(webhook.data.amount * 100);

    // Validate amount is reasonable (â‰¤ 10M naira)
    if (amountInKobo > 1000000000) {
      // Silently reject suspicious amounts
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const creditResult = await creditSabiWallet(userId, amountInKobo, txRef);

    if (!creditResult.success) {
      // Generic success response - don't expose internal errors to attacker
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log internally but don't expose to client
    // In production, use proper logging service (Sentry, LogRocket, etc)
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
