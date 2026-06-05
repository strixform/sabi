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

  // Find all scheduled orders that are due
  const due = await prisma.sabiOrder.findMany({
    where: {
      scheduledAt: { lte: now },
      status: 'pending',
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
