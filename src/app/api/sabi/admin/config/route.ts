import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    let config = await prisma.sABIAdminConfig.findFirst();

    if (!config) {
      config = await prisma.sABIAdminConfig.create({
        data: {
          minOrderQuantity: 5,
          maxOrderQuantity: 5000,
        },
      });
    }

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('[SABI CONFIG] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch config' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { minOrderQuantity, maxOrderQuantity } = body;

    if (!minOrderQuantity || !maxOrderQuantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (minOrderQuantity > maxOrderQuantity) {
      return NextResponse.json(
        { error: 'Min quantity cannot be greater than max quantity' },
        { status: 400 }
      );
    }

    let config = await prisma.sABIAdminConfig.findFirst();

    if (!config) {
      config = await prisma.sABIAdminConfig.create({
        data: {
          minOrderQuantity,
          maxOrderQuantity,
        },
      });
    } else {
      config = await prisma.sABIAdminConfig.update({
        where: { id: config.id },
        data: {
          minOrderQuantity,
          maxOrderQuantity,
        },
      });
    }

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('[SABI CONFIG] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to update config' },
      { status: 500 }
    );
  }
}
