import { NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { sabiExecute } from '@/lib/tursoClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;
export const preferredRegion = 'sfo1';

/**
 * Buyer growth dashboard data. Aggregates the user's delivered engagement per
 * profile (targetUrl) + service, plus a monthly delivered timeline, so buyers can
 * SEE the cumulative impact of their orders and re-order. Read-only.
 */
export async function GET() {
  try {
    const session = await getSabiSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Per profile (targetUrl) × service — total delivered + ordered + order count.
    const perProfile = await sabiExecute({
      sql: `SELECT targetUrl, serviceType,
                   COALESCE(SUM(completedQuantity),0) AS delivered,
                   COALESCE(SUM(quantity),0)          AS ordered,
                   COUNT(*)                            AS orders,
                   MAX(createdAt)                      AS lastAt
            FROM SabiOrder
            WHERE userId = ? AND status IN ('processing','executing','completed')
            GROUP BY targetUrl, serviceType
            ORDER BY delivered DESC
            LIMIT 300`,
      args: [session.id],
    });

    // Monthly delivered timeline (last 12 months) — for the trend chart.
    const timeline = await sabiExecute({
      sql: `SELECT strftime('%Y-%m', createdAt) AS month,
                   COALESCE(SUM(completedQuantity),0) AS delivered
            FROM SabiOrder
            WHERE userId = ? AND status IN ('processing','executing','completed')
              AND createdAt >= datetime('now','-12 months')
            GROUP BY month ORDER BY month ASC`,
      args: [session.id],
    });

    const rows = perProfile.rows as any[];
    const totalDelivered = rows.reduce((s, r) => s + Number(r.delivered || 0), 0);
    const profilesCount = new Set(rows.map(r => r.targetUrl)).size;

    return NextResponse.json({
      success: true,
      totals: { delivered: totalDelivered, profiles: profilesCount, services: rows.length },
      perProfile: rows.map(r => ({
        targetUrl: r.targetUrl, serviceType: r.serviceType,
        delivered: Number(r.delivered || 0), ordered: Number(r.ordered || 0),
        orders: Number(r.orders || 0), lastAt: r.lastAt,
      })),
      timeline: (timeline.rows as any[]).map(r => ({ month: r.month, delivered: Number(r.delivered || 0) })),
    });
  } catch (e: any) {
    return NextResponse.json({ success: true, totals: { delivered: 0, profiles: 0, services: 0 }, perProfile: [], timeline: [] });
  }
}
