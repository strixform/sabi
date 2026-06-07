import { NextRequest, NextResponse } from 'next/server';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    if (!await checkSabiAdmin(req)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get order statistics
    const [totalOrders, pendingOrders, processingOrders, completedOrders] = await Promise.all([
      prisma.sabiOrder.count(),
      prisma.sabiOrder.count({ where: { status: 'pending' } }),
      prisma.sabiOrder.count({ where: { status: 'processing' } }),
      prisma.sabiOrder.count({ where: { status: 'completed' } }),
    ]);

    // Calculate total revenue
    const totalRevenueData = await prisma.sabiOrder.aggregate({
      _sum: {
        totalPrice: true,
      },
    });

    const totalRevenue = totalRevenueData._sum.totalPrice || 0;

    // Get taskers count (from gamerz360 API)
    const gamerz360AdminApiUrl = process.env.GAMERZ360_ADMIN_API_URL || 'https://ads.gamerz360.com/api';
    const gamerz360AdminToken = process.env.GAMERZ360_ADMIN_TOKEN;

    let availableTaskers = 5; // Default

    try {
      const taskerRes = await fetch(`${gamerz360AdminApiUrl}/taskers?status=active`, {
        headers: {
          'Authorization': `Bearer ${gamerz360AdminToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (taskerRes.ok) {
        const data = await taskerRes.json();
        availableTaskers = data.taskers?.length || 5;
      }
    } catch (err) {
      // Use default if API call fails
      console.error('Error fetching taskers count:', err);
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        processingOrders,
        completedOrders,
        totalRevenue,
        availableTaskers,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
