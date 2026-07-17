import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { getSabiSession } from '@/lib/sabiAuth';
import { debitSabiWallet } from '@/lib/sabiWallet';

// One-time white-label build/setup fee, paid from the applicant's SABI wallet (see /partners/resellers).
const SETUP_FEE_KOBO = Number(process.env.WHITELABEL_SETUP_FEE_KOBO || 5_000_000); // ₦50,000

export async function POST(request: NextRequest) {
  try {
    // Applicant must be a logged-in SABI user with a funded wallet — the build fee comes from it.
    const session = await getSabiSession();
    if (!session) {
      return NextResponse.json({ error: 'Create a SABI account and fund your wallet first, then apply.', needsSabiAccount: true }, { status: 401 });
    }
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

    // Charge the one-time build fee from the SABI wallet (debit-first; refunded below if the
    // application row fails to create, so we never take money without recording the application).
    const feeRef = `whitelabel-setup-${session.id}-${Date.now()}`;
    const debit = await debitSabiWallet(session.id, SETUP_FEE_KOBO, feeRef);
    if (!debit.success) {
      return NextResponse.json(
        { error: `Fund your SABI wallet with ₦${Math.round(SETUP_FEE_KOBO / 100).toLocaleString()} to apply. ${debit.error || ''}`.trim(), needsFunds: true },
        { status: 402 }
      );
    }

    // Create reseller application
    let reseller;
    try {
      reseller = await prisma.reseller.create({
        data: {
          businessName,
          businessEmail,
          businessPhone,
          businessAddress: businessAddress || null,
          country,
          contactName,
          contactEmail,
          contactPhone,
          paymentMethod: 'sabi_wallet',
          accountNumber: accountNumber || null,
          bankCode: bankCode || null,
          status: 'pending',
        },
      });
    } catch (e) {
      // Refund the build fee — never charge without an application on file.
      const { refundSabiWallet } = await import('@/lib/sabiWallet');
      await refundSabiWallet(session.id, SETUP_FEE_KOBO, feeRef, 'White-label application failed — build fee refunded').catch(() => {});
      throw e;
    }

    // TODO: Send confirmation email to contact
    // await sendResellerApplicationConfirmationEmail({
    //   contactName,
    //   contactEmail,
    //   businessName,
    // });

    return NextResponse.json({
      success: true,
      message: `Application submitted and ₦${Math.round(SETUP_FEE_KOBO / 100).toLocaleString()} build fee paid from your SABI wallet. We'll be in touch to build your site.`,
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
