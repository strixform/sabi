import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { generateFlwTxRef, initializeFlwPayment } from '@/lib/sabiFlutterwave';

export async function POST(req: NextRequest) {
  try {
    const session = await getSabiSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount } = await req.json();

    if (!amount || amount < 500 || amount > 10000000) {
      return NextResponse.json(
        { error: 'Amount must be between ₦500 and ₦10,000,000' },
        { status: 400 }
      );
    }

    const txRef = generateFlwTxRef(session.id);
    const result = await initializeFlwPayment({
      email: session.email,
      amount,
      txRef,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/sabi/wallet/callback`,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      paymentLink: result.data?.link,
      txRef,
    });
  } catch (error) {
    console.error('Fund wallet error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
