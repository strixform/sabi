import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateSabiOrderStatus } from '@/lib/sabiOrderEngine';

export const preferredRegion = "sfo1";

/**
 * Webhook endpoint to receive completion updates from gamerz360
 * Called by gamerz360 admin when pushing campaign to taskers or when campaign completes
 *
 * Expected payload:
 * {
 *   event: 'order.progress' | 'order.completed',
 *   sabiOrderId: string,
 *   sabiUserId: string,
 *   campaignId: string,
 *   completedCount: number,
 *   targetCount: number,
 *   completionPercentage: number,
 *   status: string,
 *   timestamp: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      event,
      sabiOrderId,
      sabiUserId,
      campaignId,
      completedCount,
      targetCount,
      completionPercentage,
      status,
    } = body;

    if (!sabiOrderId || !event) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update order status
    let orderStatus = 'processing';
    if (event === 'order.completed') {
      orderStatus = 'completed';
    } else if (event === 'order.progress') {
      orderStatus = 'executing';
    }

    const result = await updateSabiOrderStatus(sabiOrderId, orderStatus, completionPercentage);

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    // If completed, process refund/payout logic if needed
    if (event === 'order.completed') {
      const order = await prisma.sabiOrder.findUnique({
        where: { id: sabiOrderId },
      });

      if (order) {
        // Record completion in database
        await prisma.sabiOrder.update({
          where: { id: sabiOrderId },
          data: {
            status: 'completed',
            completionPercentage: 100,
            completedAt: new Date(),
          },
        });

        // Log completion transaction
        await prisma.sabiTransaction.create({
          data: {
            userId: order.userId,
            orderId: sabiOrderId,
            type: 'bonus',
            amount: 0, // Can add bonus amounts here if desired
            description: `Order completed on gamerz360`,
            reference: campaignId,
          },
        });

        console.log(`[webhooks/gamerz360] Order ${sabiOrderId} completed`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated',
      orderStatus,
    });
  } catch (error) {
    console.error('[webhooks/gamerz360] error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook', details: String(error) },
      { status: 500 }
    );
  }
}
