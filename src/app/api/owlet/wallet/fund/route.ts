import { NextRequest, NextResponse } from 'next/server';
import { getOwletSession } from '@/lib/owletAuth';
import { initializeFlwPayment, generateFlwTxRef } from '@/lib/owletFlutterwave';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getOwletSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { amount } = body;

    if (!amount || amount < 500 || amount > 10000000) {
      return NextResponse.json(
        { error: 'Amount must be between ₦500 and ₦10,000,000' },
        { status: 400 }
      );
    }

    // Generate transaction reference
    const txRef = generateFlwTxRef(session.id);

    // Create pending transaction record
    await prisma.sabiTransaction.create({
      data: {
        userId: session.id,
        type: 'fund_pending',
        amount: amount * 100, // Convert to kobo
        reference: txRef,
        description: `Wallet funding initiated - ₦${amount}`,
      },
    });

    // Initialize Flutterwave payment
    const flwResult = await initializeFlwPayment({
      email: session.email,
      amount: amount,
      txRef: txRef,
    });

    if (!flwResult.success) {
      return NextResponse.json(
        { error: flwResult.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: {
        link: flwResult.data.link,
        accessCode: flwResult.data.accessCode,
        txRef: txRef,
        amount: amount,
        publicKey: flwResult.data.publicKey,
      },
    });
  } catch (error) {
    console.error('Fund wallet error:', error);
    return NextResponse.json(
      { error: 'Payment initialization failed' },
      { status: 500 }
    );
  }
}
