import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 25;
export const preferredRegion = 'sfo1';

/**
 * COMPLETION GUARANTEE — auto partial-refund on under-delivery.
 *
 * A campaign can partially fill and then stall (narrow audience, low supply). This
 * is the promise that makes the panel trustworthy: by the SLA deadline you get
 * what was delivered AND a refund for whatever wasn't — you only pay for results.
 *
 * Every run finds orders still executing past the SLA with completedQuantity <
 * quantity, refunds the undelivered remainder pro-rata, closes the order, and
 * stops the gamerz360 campaign so taskers aren't paid for refunded units.
 *
 * Idempotent: closing the order to 'completed' removes it from the next scan.
 */

const SLA_HOURS = 72;        // grace period before we refund the remainder
const MAX_PER_RUN = 12;      // bound the cross-app calls per run

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - SLA_HOURS * 3600 * 1000);

  const stalled = await prisma.sabiOrder.findMany({
    where: {
      status: { in: ['executing', 'processing'] },
      createdAt: { lt: cutoff },
    },
    take: MAX_PER_RUN,
    orderBy: { createdAt: 'asc' },
  });

  const due = stalled.filter(o => (o.completedQuantity || 0) < o.quantity);
  if (due.length === 0) return NextResponse.json({ checked: stalled.length, refunded: 0 });

  const results: { id: string; refundKobo: number; delivered: number; quantity: number }[] = [];

  for (const order of due) {
    const delivered = Math.max(0, order.completedQuantity || 0);
    const remainder = order.quantity - delivered;
    if (remainder <= 0) continue;

    // Pro-rata of the unit cost (totalPrice covers `quantity` units). The platform
    // fee is the service charge and isn't pro-rated.
    const refundKobo = Math.round((order.totalPrice / order.quantity) * remainder);

    try {
      await prisma.$transaction([
        prisma.sabiOrder.update({
          where: { id: order.id },
          data: {
            status: 'completed',
            completionPercentage: Math.min(100, Math.round((delivered / order.quantity) * 100)),
            refundReason: `Partially delivered (${delivered.toLocaleString()} of ${order.quantity.toLocaleString()}). ₦${Math.round(refundKobo / 100).toLocaleString()} refunded for the undelivered remainder — you only pay for what's delivered.`,
          },
        }),
        ...(refundKobo > 0 ? [
          prisma.sabiWallet.update({
            where: { userId: order.userId },
            data: { balance: { increment: refundKobo }, totalSpent: { decrement: refundKobo } },
          }),
        ] : []),
      ]);
      results.push({ id: order.id, refundKobo, delivered, quantity: order.quantity });

      // Stop the gamerz360 campaign so no further (now-refunded) completions are paid.
      if (order.gamesz360CampaignId) {
        const g360 = process.env.GAMERZ360_API_URL || 'https://gamerz360.com';
        fetch(`${g360}/api/admin/sabi/cancel-campaign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SABI_INTEGRATION_TOKEN}`,
            'User-Agent': 'Mozilla/5.0 (compatible; SABI-Integration/1.0)',
          },
          body: JSON.stringify({ campaignId: order.gamesz360CampaignId, reason: 'SLA partial-refund — remainder refunded to buyer' }),
        }).catch(() => {});
      }
    } catch (e: any) {
      console.error('[partial-refund] failed for', order.id, e?.message);
    }
  }

  const totalRefundedKobo = results.reduce((s, r) => s + r.refundKobo, 0);
  console.log(`[partial-refund] closed ${results.length} stalled orders, refunded ₦${Math.round(totalRefundedKobo / 100)}`);
  return NextResponse.json({ checked: stalled.length, refunded: results.length, totalRefundedNaira: Math.round(totalRefundedKobo / 100), results });
}
