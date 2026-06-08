import { NextRequest, NextResponse } from 'next/server';
import { verifyKorapayWebhookSignature, parseKorapayWebhook } from '@/lib/sabiKorapay';
import { creditSabiWallet } from '@/lib/sabiWallet';
import { prisma } from '@/lib/prisma';
export const maxDuration = 15;


export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-korapay-signature');

    if (!signature) {
      // Silently reject invalid webhook attempts
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const body = await req.text();

    if (!verifyKorapayWebhookSignature(body, signature)) {
      // Don't expose signature validation failures
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const payload = JSON.parse(body);

    if (payload.event !== 'charge.success') {
      // Accept all webhook events - we only process relevant ones
      return NextResponse.json({ success: true });
    }

    const { reference, amount, email } = parseKorapayWebhook(payload);

    // Validate email format to prevent abuse
    if (!email || !email.includes('@')) {
      // Silently ignore malformed data
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const user = await prisma.sabiUser.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't expose user enumeration
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Check for duplicate transaction
    const existingTxn = await prisma.sabiTransaction.findFirst({
      where: {
        userId: user.id,
        reference,
      },
    });

    if (existingTxn) {
      // Duplicate transaction - silently accept
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const amountInKobo = Math.round(amount * 100);

    // Validate amount is reasonable (≤ 10M naira)
    if (amountInKobo > 1000000000) {
      // Silently reject suspicious amounts
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const creditResult = await creditSabiWallet(user.id, amountInKobo, reference);

    // Process webhook regardless of result - don't expose internal state
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    // Catch all errors and return success to prevent retry storms
    // Errors are logged to a proper logging service in production (Sentry, etc)
    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  }
}
