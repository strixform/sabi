/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SABI ORDER PROCESSING CRON
 * GET /api/sabi/cron/process-scheduled
 * Runs every 5 minutes via Vercel Cron (vercel.json)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * WHY THIS EXISTS (async order architecture):
 *   When a user places a SABI order, we DON'T call gamerz360 synchronously.
 *   Cloudflare (which fronts both sability.io and gamerz360.com) blocks
 *   server-to-server Vercel requests, causing 504 timeouts. Instead:
 *     1. Order is created as status = 'pending' with no gamesz360CampaignId
 *     2. User gets instant success response
 *     3. THIS CRON picks it up and submits to gamerz360 within 5 minutes
 *
 * WHAT ORDERS ARE PROCESSED:
 *   - status = 'pending' AND gamesz360CampaignId IS NULL
 *   - scheduledAt IS NULL (immediate orders) OR scheduledAt <= now
 *   Up to 50 orders per run to avoid timeout.
 *
 * SUCCESS PATH:
 *   gamerz360 returns { campaignId, advertiserId }
 *   → SabiOrder.gamesz360CampaignId = campaignId (links the two systems)
 *   → SabiOrder.status = 'executing'
 *   → Admin sees campaign in SABI Command Center, pushes to taskers
 *
 * FAILURE PATH:
 *   gamerz360 returns non-2xx
 *   → SabiOrder.status = 'failed'
 *   → Full refund to user's wallet (totalPrice + platformFee)
 *   → results array records the error for logging
 *
 * AUTHENTICATION:
 *   Vercel sends Authorization: Bearer CRON_SECRET automatically.
 *   If CRON_SECRET env is not set, the route is open (dev only).
 *
 * INTEGRATION TOKEN:
 *   The POST to gamerz360/api/admin/sabi/orders uses SABI_INTEGRATION_TOKEN.
 *   Must match gamerz360's SABI_INTEGRATION_TOKEN. If they differ, all
 *   orders fail with 401 and stay pending indefinitely.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Called by Vercel Cron every 5 minutes.
// Finds SabiOrders where scheduledAt <= now AND status = 'pending',
// then submits them to gamerz360 exactly like a regular order.

export async function GET(req: NextRequest) {
  // Verify it's from Vercel Cron or our secret
  const auth = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // Find ALL pending orders that haven't been submitted to gamerz360 yet.
  // This includes:
  //   1. Scheduled orders whose scheduledAt time has passed
  //   2. Regular orders that are pending submission (scheduledAt = null, no campaignId yet)
  // The cron runs every 5 min — this is the only way orders reach gamerz360
  // since the synchronous call was replaced with this async approach to avoid
  // Cloudflare blocking Vercel's server IPs.
  const due = await prisma.sabiOrder.findMany({
    where: {
      status: 'pending',
      gamesz360CampaignId: null, // not yet submitted to gamerz360
      OR: [
        { scheduledAt: null },           // regular immediate orders
        { scheduledAt: { lte: now } },   // scheduled orders whose time has come
      ],
    },
    include: {
      user: { select: { id: true, email: true, name: true, businessName: true } },
    },
    take: 50, // process max 50 at once
  });

  if (due.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No scheduled orders due' });
  }

  const results: { id: string; success: boolean; error?: string }[] = [];

  for (const order of due) {
    try {
      // Call gamerz360 integration
      const gamerz360ApiUrl = process.env.GAMERZ360_API_URL || 'https://gamerz360.com';
      const integrationToken = process.env.SABI_INTEGRATION_TOKEN;

      if (!integrationToken) {
        results.push({ id: order.id, success: false, error: 'Integration token not set' });
        continue;
      }

      const payload = {
        sabiOrderId: order.id,
        serviceType: order.serviceType,
        targetUrl: order.targetUrl,
        quantity: order.quantity,
        totalPrice: order.totalPrice,
        sabiUserId: order.userId,
        sabiUserEmail: order.user.email,
        webhookUrl: `${process.env.SABI_BASE_URL || 'https://sability.io'}/api/webhooks/gamerz360`,
        targetingNote: [
          order.audienceGender && order.audienceGender !== 'both' ? `Audience: ${order.audienceGender}` : null,
          order.audienceLocation && order.audienceLocation !== 'All Nigeria' ? `Location: ${order.audienceLocation}` : null,
          order.commentGender && order.commentGender !== 'both' ? `Commenters: ${order.commentGender}` : null,
          order.commentInstructions ? `Comment brief: ${order.commentInstructions}` : null,
        ].filter(Boolean).join(' | ') || undefined,
      };

      const response = await fetch(`${gamerz360ApiUrl}/api/admin/sabi/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${integrationToken}` },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        await prisma.sabiOrder.update({
          where: { id: order.id },
          data: {
            status: 'executing',
            gamesz360CampaignId: data.campaignId,
            gamesz360AdvertiserId: data.advertiserId,
            estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            scheduledAt: null, // clear so it's not picked up again
          },
        });
        results.push({ id: order.id, success: true });
      } else {
        // Refund and fail
        await prisma.$transaction([
          prisma.sabiOrder.update({ where: { id: order.id }, data: { status: 'failed' } }),
          prisma.sabiWallet.update({ where: { userId: order.userId }, data: { balance: { increment: order.totalPrice + order.platformFee }, totalSpent: { decrement: order.totalPrice + order.platformFee } } }),
        ]);
        results.push({ id: order.id, success: false, error: `gamerz360 returned ${response.status}` });
      }
    } catch (err: any) {
      results.push({ id: order.id, success: false, error: err?.message });
    }
  }

  const succeeded = results.filter(r => r.success).length;
  console.log(`[CRON] Processed ${due.length} scheduled orders: ${succeeded} succeeded`);

  return NextResponse.json({ processed: due.length, succeeded, results });
}
