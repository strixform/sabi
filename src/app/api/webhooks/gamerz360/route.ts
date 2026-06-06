import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { invalidateOrdersCache } from '@/lib/redis';

export const preferredRegion = "sfo1";

/**
 * Receives live progress + completion webhooks from gamerz360.
 *
 * Fired on every individual task approval (1 follow = 1 call), giving users
 * real-time order progress. Also fires once on full campaign completion.
 *
 * Payload:
 *   event            'order.progress' | 'order.completed'
 *   sabiOrderId      string
 *   sabiUserId       string
 *   campaignId       string
 *   completedCount   number   — total approved so far
 *   targetCount      number
 *   completionPercentage number
 *   status           string
 */
export async function POST(req: NextRequest) {
  try {
    // Verify integration token so random callers can't fake progress
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const expected = process.env.SABI_INTEGRATION_TOKEN || "";
    if (expected && token !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      event, sabiOrderId, sabiUserId,
      completedCount, targetCount, completionPercentage,
    } = body;

    if (!sabiOrderId || !event) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Map gamerz360 events → SABI order statuses
    const isComplete = event === "order.completed";
    const newStatus = isComplete ? "completed" : "executing";

    // Update the order with the live count + percentage
    const order = await prisma.sabiOrder.update({
      where: { id: sabiOrderId },
      data: {
        status: newStatus,
        completedQuantity: completedCount ?? 0,
        completionPercentage: completionPercentage ?? 0,
        ...(isComplete ? { completedAt: new Date() } : {}),
      },
      include: {
        user: { select: { id: true, email: true, name: true, notifyEmail: true } },
      },
    });

    // Bust the Redis order cache so the user's next page load shows live count
    await invalidateOrdersCache(order.userId).catch(() => {});

    // Send push + email notifications at key milestones — not every single tick
    const milestones = [25, 50, 75, 100];
    const pct = completionPercentage ?? 0;
    const shouldNotify = isComplete || milestones.includes(pct);

    if (shouldNotify && order.user) {
      const svcName = order.serviceType.replace(/_/g, " ");
      try {
        const { sendPushToUser } = await import("@/lib/pushNotifications");
        if (isComplete) {
          sendPushToUser(order.userId, {
            title: "✅ Order Completed!",
            body: `Your ${svcName} order (${order.quantity} units) is done.`,
            url: `https://sability.io/sabi/orders/${sabiOrderId}`,
          });
        } else {
          sendPushToUser(order.userId, {
            title: `📈 Order ${pct}% done`,
            body: `${completedCount}/${targetCount} ${svcName} completed so far.`,
            url: `https://sability.io/sabi/orders/${sabiOrderId}`,
          });
        }
      } catch {}

      // Email only on completion
      if (isComplete && order.user.notifyEmail) {
        try {
          const { sendOrderCompletedEmail } = await import("@/lib/email");
          sendOrderCompletedEmail(order.user.email, order.user.name, sabiOrderId, svcName, order.quantity);
        } catch {}
      }
    }

    // On completion: log a transaction record
    if (isComplete) {
      await prisma.sabiTransaction.create({
        data: {
          userId: order.userId,
          orderId: sabiOrderId,
          type: "bonus",
          amount: 0,
          description: `Order completed — ${order.quantity} ${order.serviceType.replace(/_/g, " ")}`,
          reference: body.campaignId || sabiOrderId,
        },
      }).catch(() => {}); // non-fatal
    }

    return NextResponse.json({
      success: true,
      event,
      sabiOrderId,
      completedCount,
      newStatus,
    });
  } catch (error: any) {
    console.error("[webhooks/gamerz360]", error);
    return NextResponse.json(
      { error: "Failed to process webhook", details: error?.message },
      { status: 500 }
    );
  }
}
