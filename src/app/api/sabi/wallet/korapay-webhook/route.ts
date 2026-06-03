import { NextRequest, NextResponse } from 'next/server';
import { verifyKorapayWebhookSignature, parseKorapayWebhook } from '@/lib/sabiKorapay';
import { creditSabiWallet } from '@/lib/sabiWallet';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-korapay-signature');

    if (!signature) {
      console.warn('Missing Korapay signature');
      return NextResponse.json({ error: 'Signature missing' }, { status: 400 });
    }

    const body = await req.text();

    if (!verifyKorapayWebhookSignature(body, signature)) {
      console.warn('Invalid Korapay webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);

    if (payload.event !== 'charge.success') {
      console.log('Skipping non-success event:', payload.event);
      return NextResponse.json({ success: true });
    }

    const { reference, amount, email } = parseKorapayWebhook(payload);

    const user = await prisma.sabiUser.findUnique({
      where: { email },
    });

    if (!user) {
      console.error('User not found for email:', email);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const amountInKobo = Math.round(amount * 100);
    const creditResult = await creditSabiWallet(user.id, amountInKobo, reference);

    if (!creditResult.success) {
      console.error('Wallet credit failed:', creditResult.error);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    console.log(`Wallet credited: User ${user.id}, Amount ₦${amount}, Ref ${reference}`);

    return NextResponse.json({
      success: true,
      message: 'Webhook processed',
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { success: true, error: 'Processing error (logged)' },
      { status: 200 }
    );
  }
}
