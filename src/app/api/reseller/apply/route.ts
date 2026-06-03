import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient();
    const body = await request.json();

    const {
      businessName,
      businessEmail,
      businessPhone,
      businessAddress,
      country,
      contactName,
      contactEmail,
      contactPhone,
      paymentMethod,
      accountNumber,
      bankCode,
    } = body;

    // Validation
    if (!businessName || !businessEmail || !contactName || !contactEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if business email already applied
    const existingReseller = await prisma.reseller.findUnique({
      where: { businessEmail },
    });

    if (existingReseller) {
      return NextResponse.json(
        { error: 'This email has already submitted an application' },
        { status: 400 }
      );
    }

    // Create reseller application
    const reseller = await prisma.reseller.create({
      data: {
        businessName,
        businessEmail,
        businessPhone,
        businessAddress: businessAddress || null,
        country,
        contactName,
        contactEmail,
        contactPhone,
        paymentMethod: paymentMethod || 'bank_transfer',
        accountNumber: accountNumber || null,
        bankCode: bankCode || null,
        status: 'pending',
      },
    });

    // TODO: Send confirmation email to contact
    // await sendResellerApplicationConfirmationEmail({
    //   contactName,
    //   contactEmail,
    //   businessName,
    // });

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      resellerId: reseller.id,
    });
  } catch (error) {
    console.error('Reseller apply error:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}
