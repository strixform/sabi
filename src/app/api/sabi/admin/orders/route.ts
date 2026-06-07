import { NextRequest, NextResponse } from 'next/server';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    if (!await checkSabiAdmin(req)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all orders with user info
    const orders = await prisma.sabiOrder.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 500, // Limit to last 500 orders
    });

    return NextResponse.json({
      success: true,
      orders: orders.map(order => ({
        id: order.id,
        serviceType: order.serviceType,
        targetUrl: order.targetUrl,
        quantity: order.quantity,
        totalPrice: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt,
        user: order.user,
      })),
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
