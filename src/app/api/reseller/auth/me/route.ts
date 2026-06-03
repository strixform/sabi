import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { verifyResellerToken } from '@/lib/resellerAuth';

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyResellerToken();

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const prisma = getPrismaClient();

    const reseller = await prisma.reseller.findUnique({
      where: { id: payload.resellerId },
      select: {
        id: true,
        businessName: true,
        businessEmail: true,
        businessPhone: true,
        businessAddress: true,
        contactName: true,
        contactEmail: true,
        country: true,
        status: true,
        createdAt: true,
      },
    });

    if (!reseller) {
      return NextResponse.json(
        { error: 'Reseller not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      reseller,
    });
  } catch (error) {
    console.error('Error fetching reseller info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reseller information' },
      { status: 500 }
    );
  }
}
