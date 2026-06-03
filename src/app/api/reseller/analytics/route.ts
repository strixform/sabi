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
    const dateRange = searchParams.get('range') || 'month';

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

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (dateRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'month':
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    // Fetch orders in date range
    const orders = await prisma.resellerOrder.findMany({
      where: {
        siteId: resellerSite.id,
        createdAt: { gte: startDate },
      },
    });

    // Calculate statistics
    const stats = {
      totalOrders: orders.length,
      completedOrders: orders.filter(o => o.status === 'completed').length,
      processingOrders: orders.filter(o => o.status === 'processing').length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      failedOrders: orders.filter(o => o.status === 'failed').length,
      totalRevenue: orders.reduce((sum, o) => sum + o.totalPrice, 0),
      resellerRevenue: orders.reduce((sum, o) => sum + (o.resellerRevenue || 0), 0),
      platformFees: orders.reduce((sum, o) => sum + (o.platformFee || 0), 0),
    };

    // Service breakdown
    const serviceBreakdown = orders.reduce((acc, order) => {
      const existing = acc.find(s => s.type === order.serviceType);
      if (existing) {
        existing.count += 1;
        existing.revenue += order.totalPrice;
      } else {
        acc.push({
          type: order.serviceType,
          count: 1,
          revenue: order.totalPrice,
        });
      }
      return acc;
    }, [] as Array<{ type: string; count: number; revenue: number }>);

    // Status breakdown
    const statusBreakdown = {
      completed: orders.filter(o => o.status === 'completed').length,
      processing: orders.filter(o => o.status === 'processing').length,
      pending: orders.filter(o => o.status === 'pending').length,
      failed: orders.filter(o => o.status === 'failed').length,
    };

    return NextResponse.json({
      success: true,
      dateRange,
      stats,
      serviceBreakdown,
      statusBreakdown,
      orders,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
