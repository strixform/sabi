/**
 * SABI Admin — a single user's order history
 * GET /api/sabi/admin/user-orders?userId=xxx
 *
 * Powers the "view this customer's orders" drill-down on the admin Users tab.
 * Direct libsql (sabiExecute) — fast, no Prisma cold start.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
import { sabiExecute } from '@/lib/tursoClient';

export const preferredRegion = 'sfo1';
export const maxDuration = 15;

export async function GET(req: NextRequest) {
  if (!await checkSabiAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const userId = new URL(req.url).searchParams.get('userId')?.trim();
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  try {
    const result = await sabiExecute({
      sql: `SELECT id, serviceType, targetUrl, quantity, totalPrice, platformFee,
                   status, completedQuantity, completionPercentage,
                   paymentMethod, transactionRef, gamesz360CampaignId,
                   audienceGender, audienceLocation, createdAt, estimatedCompletion
            FROM SabiOrder
            WHERE userId = ?
            ORDER BY createdAt DESC
            LIMIT 200`,
      args: [userId],
    });

    return NextResponse.json({
      success: true,
      orders: (result.rows as any[]).map(o => ({
        id: o.id,
        serviceType: o.serviceType,
        targetUrl: o.targetUrl,
        quantity: Number(o.quantity),
        totalPrice: Number(o.totalPrice),       // kobo
        platformFee: Number(o.platformFee),     // kobo
        amountPaid: Number(o.totalPrice) + Number(o.platformFee), // kobo
        status: o.status,
        completedQuantity: Number(o.completedQuantity || 0),
        completionPercentage: Number(o.completionPercentage || 0),
        paymentMethod: o.paymentMethod,
        transactionRef: o.transactionRef || null,
        campaignId: o.gamesz360CampaignId || null,
        audienceGender: o.audienceGender || null,
        audienceLocation: o.audienceLocation || null,
        createdAt: o.createdAt,
        estimatedCompletion: o.estimatedCompletion || null,
      })),
    });
  } catch (e: any) {
    console.error('[admin/user-orders]', e?.message);
    return NextResponse.json({ error: 'Failed to load orders', detail: e?.message?.slice(0, 140) }, { status: 500 });
  }
}
