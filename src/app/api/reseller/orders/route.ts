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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    // Find reseller's site
    const resellerSite = await prisma.resellerSite.findFirst({
      where: { resellerId: payload.resellerId },
    });

    if (!resellerSite) {
      return NextResponse.json(
        { error: 'No site found for reseller' },
        { status: 404 }
      );
    }

    // Build query
    const where: any = { siteId: resellerSite.id };
    if (status) {
      where.status = status;
    }

    // Fetch orders
    const [orders, total] = await Promise.all([
      prisma.resellerOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.resellerOrder.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
