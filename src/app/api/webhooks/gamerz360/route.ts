/**
 * ═══════════════════════════════════════════════════════════════════════════
 * gamerz360 → SABI PROGRESS WEBHOOK RECEIVER
 * POST /api/webhooks/gamerz360
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Receives real-time task completion updates from gamerz360.com and updates
 * the SABI user's order status so they see live progress.
 *
 * WHEN IS THIS CALLED?
 *   1. When a tasker submits proof on gamerz360 (tasks/[id]/complete) —
 *      fires immediately for every single completed task (1 follow = 1 call)
 *   2. When admin disputes a completion — count drops by 1 (corrective event)
 *   3. When admin pushes campaign to taskers — fires "order.progress" once
 *
 * AUTHENTICATION:
 *   Bearer SABI_INTEGRATION_TOKEN header. Must match the value in gamerz360's
 *   Vercel environment variables. If tokens mismatch, all webhooks will 401.
 *   Check both Vercel projects if progress stops updating.
 *
 * WHAT THIS UPDATES:
 *   SabiOrder.status            → 'executing' (in progress) or 'completed'
 *   SabiOrder.completedQuantity → live count (e.g. 13 of 20)
 *   SabiOrder.completionPercentage → 0-100
 *   SabiOrder.completedAt       → set on order.completed event only
 *
 * CACHE BUST:
 *   Calls invalidateOrdersCache(userId) after every update so the user's
 *   next /sabi/orders page load fetches fresh data instead of cached.
 *
 * PUSH NOTIFICATIONS:
 *   Sent at 25%, 50%, 75%, 100% milestones ONLY — not every tick.
 *   Completion email sent only on order.completed event.
 *
 * EVENTS:
 *   order.progress  → partial completion (completedCount < targetCount)
 *   order.completed → all tasks done (completedCount >= targetCount)
 *
 * PAYLOAD SHAPE (sent by gamerz360):
 *   event, sabiOrderId, sabiUserId, campaignId,
 *   completedCount, targetCount, completionPercentage, status, timestamp
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { invalidateOrdersCache } from '@/lib/redis';
import { releaseNextDripSlice } from '@/lib/sabiOrderEngine';

export const preferredRegion = "sfo1";
export const maxDuration = 10; // fast DB update + fire-and-forget notifications

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
    // SECURITY: reject if token missing OR mismatched — never allow unguarded access.
    // An unset SABI_INTEGRATION_TOKEN means env is misconfigured, not open door.
    if (!expected || token !== expected) {
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

    // ROOT-CAUSE GUARD: a terminal order (completed/failed/cancelled) is FROZEN. A late
    // 'order.progress' must never revert it back to 'executing' — that's what let a refund
    // cron re-pick-up and re-refund the same order (the double-refund incident). A late
    // 'order.completed' must likewise never un-fail a refunded order. Only advance status
    // when the order isn't already terminal.
    const adv = await prisma.sabiOrder.updateMany({
      where: { id: sabiOrderId, status: { notIn: ["completed", "failed", "cancelled"] } },
      data: { status: newStatus, ...(isComplete ? { completedAt: new Date() } : {}) },
    });
    const statusAdvanced = adv.count === 1;          // status actually changed this call
    const justCompleted = isComplete && statusAdvanced; // transitioned to completed now

    // Live counts are always safe to refresh (even on a frozen terminal order).
    const order = await prisma.sabiOrder.update({
      where: { id: sabiOrderId },
      data: {
        completedQuantity: completedCount ?? 0,
        completionPercentage: completionPercentage ?? 0,
      },
      include: {
        user: { select: { id: true, email: true, name: true, notifyEmail: true } },
      },
    });

    // Bust the Redis order cache so the user's next page load shows live count
    await invalidateOrdersCache(order.userId).catch(() => {});

    // Completion-mode drip chains: now that this slice is done, hand off to the
    // next parked slice so the chain keeps moving (no-op for non-drip orders).
    if (justCompleted) await releaseNextDripSlice(order.id);

    // Loyalty cashback — credit 2% (max ₦500) of what was paid, once, on completion.
    if (justCompleted) {
      const chargedKobo = order.totalPrice + order.platformFee - (order.discountAmount || 0);
      import('@/lib/sabiCashback').then(async ({ creditOrderCashback }) => {
        const credited = await creditOrderCashback(order.id, order.userId, chargedKobo);
        if (credited > 0) {
          await invalidateOrdersCache(order.userId).catch(() => {});
          try {
            const { sendPushToUser } = await import('@/lib/pushNotifications');
            sendPushToUser(order.userId, {
              title: `🎁 ₦${Math.round(credited / 100)} cashback earned`,
              body: `We added ₦${Math.round(credited / 100)} loyalty cashback to your wallet for your completed order.`,
              url: 'https://sability.io/sabi/wallet',
            }).catch(() => {});
          } catch {}
        }
      }).catch(() => {});
    }

    // Send push + email notifications at key milestones — not every single tick
    const milestones = [25, 50, 75, 100];
    const pct = completionPercentage ?? 0;
    // Only notify when the status actually moved this call — never for a late tick on a
    // frozen terminal order.
    const shouldNotify = statusAdvanced && (isComplete || milestones.includes(pct));

    if (shouldNotify && order.user) {
      const svcName = order.serviceType.replace(/_/g, " ");
      try {
        // Fire-and-forget with explicit .catch() — non-awaited is intentional
        // (notifications must never block the webhook response)
        const { sendPushToUser } = await import("@/lib/pushNotifications");
        if (isComplete) {
          sendPushToUser(order.userId, {
            title: "✅ Order Completed!",
            body: `Your ${svcName} order (${order.quantity} units) is done.`,
            url: `https://sability.io/sabi/orders/${sabiOrderId}`,
          }).catch(() => {});
        } else {
          sendPushToUser(order.userId, {
            title: `📈 Order ${pct}% done`,
            body: `${completedCount}/${targetCount} ${svcName} completed so far.`,
            url: `https://sability.io/sabi/orders/${sabiOrderId}`,
          }).catch(() => {});
        }
      } catch {}

      // Email only on completion — fire-and-forget with .catch()
      if (isComplete && order.user.notifyEmail) {
        try {
          const { sendOrderCompletedEmail } = await import("@/lib/email");
          sendOrderCompletedEmail(order.user.email, order.user.name, sabiOrderId, svcName, order.quantity).catch(() => {});
        } catch {}
      }
    }

    // On completion: log a transaction record (only on the real transition)
    if (justCompleted) {
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
