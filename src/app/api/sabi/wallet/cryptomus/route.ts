import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { createCryptomusInvoice, generateCryptomusOrderId, cryptomusConfigured } from '@/lib/sabiCryptomus';
export const maxDuration = 15;
export const preferredRegion = 'sfo1'; // Turso DB in Oregon (sfo1) — keeps latency minimal

export async function POST(req: NextRequest) {
  try {
    const session = await getSabiSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!cryptomusConfigured()) {
      return NextResponse.json({ error: 'Crypto payments are not available right now.' }, { status: 503 });
    }

    const { amount } = await req.json();
    if (!amount || amount < 500 || amount > 10000000) {
      return NextResponse.json({ error: 'Amount must be between ₦500 and ₦10,000,000' }, { status: 400 });
    }

    const orderId = generateCryptomusOrderId(session.id);
    const result = await createCryptomusInvoice({
      userId: session.id,
      email: session.email,
      amount,
      orderId,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/sabi/wallet/callback`,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to start crypto payment' }, { status: 500 });
    }

    return NextResponse.json({ success: true, paymentLink: result.url, txRef: orderId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 });
  }
}
