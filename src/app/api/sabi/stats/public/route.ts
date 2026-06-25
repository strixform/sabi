import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServiceById } from '@/lib/servicesCatalog';

export const maxDuration = 15;
export const preferredRegion = 'sfo1';

/**
 * GET /api/sabi/stats/public
 * Aggregate social-proof counters for the landing page. No auth.
 * Cached in-memory per warm instance for 5 minutes to keep it cheap.
 */
let cache: { at: number; data: any } | null = null;
const TTL = 5 * 60 * 1000;

export async function GET() {
  if (cache && Date.now() - cache.at < TTL) {
    return NextResponse.json({ ...cache.data, cached: true });
  }

  try {
    const [actionsAgg, ordersDelivered, totalOrders, recentRows] = await Promise.all([
      prisma.sabiOrder.aggregate({
        _sum: { completedQuantity: true },
        where: { status: { in: ['executing', 'completed'] } },
      }),
      prisma.sabiOrder.count({ where: { status: 'completed' } }),
      prisma.sabiOrder.count(),
      // Recent activity for the live ticker. NO user identity — just service +
      // quantity + time, so it's pure social proof and leaks nothing private.
      prisma.sabiOrder.findMany({
        where: { status: { in: ['executing', 'completed'] } },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: { serviceType: true, quantity: true, createdAt: true },
      }),
    ]);

    const recent = recentRows.map((r) => ({
      service: getServiceById(r.serviceType)?.name || 'an order',
      quantity: r.quantity,
      at: r.createdAt,
    }));

    const data = {
      success: true,
      actionsDelivered: actionsAgg._sum.completedQuantity || 0,
      ordersDelivered,
      totalOrders,
      recent,
    };
    cache = { at: Date.now(), data };
    return NextResponse.json(data);
  } catch {
    // Never break the landing page — return zeros (client hides if zero).
    return NextResponse.json({ success: true, actionsDelivered: 0, ordersDelivered: 0, totalOrders: 0, recent: [] });
  }
}
