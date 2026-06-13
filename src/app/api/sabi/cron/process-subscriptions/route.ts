/**
 * ════════════════════════════════════════════════════════════════════════════
 * SABI AUTO-REORDER CRON
 * GET /api/sabi/cron/process-subscriptions
 * Runs hourly via Vercel Cron (vercel.json)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Finds active subscriptions whose nextRunAt is due, and re-places the order
 * through the normal order engine (createSabiOrder) — which debits the wallet
 * and queues it as 'pending'. The process-scheduled cron then submits it to
 * gamerz360 like any other order.
 *
 *   SUCCESS → advance nextRunAt by intervalDays.
 *   INSUFFICIENT FUNDS / failure → pause the subscription so it stops retrying
 *     every hour, and email the user to top up & resume.
 *
 * AUTH: Vercel sends Authorization: Bearer CRON_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDueSubscriptions, advanceSubscription, pauseSubscription } from '@/lib/sabiSubscriptions';
import { createSabiOrder } from '@/lib/sabiOrderEngine';

export const dynamic = 'force-dynamic';
export const maxDuration = 25;
export const preferredRegion = 'sfo1';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  let due;
  try {
    due = await getDueSubscriptions(now, 10);
  } catch (e: any) {
    return NextResponse.json({ skipped: true, reason: 'subs query failed', msg: e?.message }, { status: 200 });
  }

  if (due.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No subscriptions due' });
  }

  const results: { id: string; success: boolean; orderId?: string; error?: string }[] = [];

  for (const sub of due) {
    try {
      const result = await createSabiOrder({
        userId: sub.userId,
        serviceId: sub.serviceId,
        targetUrl: sub.targetUrl,
        quantity: sub.quantity,
        paymentMethod: 'wallet',
        audienceGender: (sub.audienceGender as any) || undefined,
        audienceLocation: sub.audienceLocation || undefined,
        commentGender: (sub.commentGender as any) || undefined,
        commentInstructions: sub.commentInstructions || undefined,
      });

      if (result.success && result.orderId) {
        await advanceSubscription(sub.id, sub.intervalDays, result.orderId);
        results.push({ id: sub.id, success: true, orderId: result.orderId });
      } else {
        // Insufficient funds or order rejected — pause so we don't retry hourly.
        await pauseSubscription(sub.id);
        results.push({ id: sub.id, success: false, error: result.error || 'order failed' });
        // Notify the user their auto-reorder paused (fire-and-forget).
        import('@/lib/prisma').then(async ({ prisma }) => {
          const user = await prisma.sabiUser.findUnique({ where: { id: sub.userId }, select: { email: true, name: true, notifyEmail: true } });
          if (!user?.notifyEmail) return;
          const { sendAutoReorderPausedEmail } = await import('@/lib/email').catch(() => ({ sendAutoReorderPausedEmail: null as any }));
          if (sendAutoReorderPausedEmail) sendAutoReorderPausedEmail(user.email, user.name, sub.serviceId);
        }).catch(() => {});
      }
    } catch (err: any) {
      results.push({ id: sub.id, success: false, error: err?.message });
    }
  }

  const succeeded = results.filter(r => r.success).length;
  console.log(`[CRON] Auto-reorder: ${due.length} due, ${succeeded} placed`);
  return NextResponse.json({ processed: due.length, succeeded, results });
}
