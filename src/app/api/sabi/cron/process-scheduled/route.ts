/**
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * SABI ORDER PROCESSING CRON
 * GET /api/sabi/cron/process-scheduled
 * Runs every 5 minutes via Vercel Cron (vercel.json)
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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
 *   â†’ SabiOrder.gamesz360CampaignId = campaignId (links the two systems)
 *   â†’ SabiOrder.status = 'executing'
 *   â†’ Admin sees campaign in SABI Command Center, pushes to taskers
 *
 * FAILURE PATH:
 *   gamerz360 returns non-2xx
 *   â†’ SabiOrder.status = 'failed'
 *   â†’ Full refund to user's wallet (totalPrice + platformFee)
 *   â†’ results array records the error for logging
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
import { sabiExecute } from '@/lib/tursoClient';
import { creditSabiRefund } from '@/lib/sabiRefund';

export const dynamic = 'force-dynamic';
export const maxDuration = 25;
export const preferredRegion = 'sfo1'; // Turso DB in Oregon (sfo1) — keeps latency minimal // keep short â€” cron runs every 5min, 60s was holding Turso connections too long

// Called by Vercel Cron every 5 minutes.
// Finds SabiOrders where scheduledAt <= now AND status = 'pending',
// then submits them to gamerz360 exactly like a regular order.

export async function GET(req: NextRequest) {
  // Verify it's from Vercel Cron or our secret
  const auth = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  // SECURITY: always require auth â€” if secret is unset the env is misconfigured,
  // not open season. Prevents unauthenticated callers from spamming gamerz360.
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // Quick DB health check â€” bail out immediately if Turso is 429-ing
  // so we don't hold a 25s connection and worsen the rate limit
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('db_ping_timeout')), 3000)),
    ]);
  } catch (pingErr: any) {
    const msg = String(pingErr?.message || pingErr);
    if (msg.includes('429') || msg.includes('timeout')) {
      return NextResponse.json({ skipped: true, reason: 'Turso rate-limited â€” skipping this cron run', msg }, { status: 200 });
    }
  }

  // SELF-HEAL drip chains. Completion-mode chains advance by un-parking slice i+1
  // when slice i completes. If that release was ever missed (e.g. a completion path
  // that bypassed the hook), the held slices sit at a far-future scheduledAt forever.
  // This sweep recovers EVERY stalled chain — and runs every 5 min, so it also
  // back-fills the existing backlog on the first run after deploy: release any
  // still-parked pending slice whose immediately-prior sibling is already completed.
  // Runs BEFORE the `due` query so freed slices go out in this same run. Idempotent
  // (only touches still-parked pending slices); harmless to repeat.
  try {
    await sabiExecute({
      sql: `UPDATE SabiOrder SET scheduledAt = datetime('now')
            WHERE dripMode = 'completion'
              AND status = 'pending'
              AND gamesz360CampaignId IS NULL
              AND dripChainId IS NOT NULL
              AND (scheduledAt IS NULL OR scheduledAt > datetime('now'))
              AND EXISTS (
                SELECT 1 FROM SabiOrder prev
                WHERE prev.dripChainId = SabiOrder.dripChainId
                  AND prev.dripIndex = SabiOrder.dripIndex - 1
                  AND prev.status = 'completed'
              )`,
      args: [],
    });
  } catch (e: any) {
    console.error('[CRON] drip self-heal sweep failed:', e?.message);
  }

  // Find ALL pending orders that haven't been submitted to gamerz360 yet.
  // This includes:
  //   1. Scheduled orders whose scheduledAt time has passed
  //   2. Regular orders that are pending submission (scheduledAt = null, no campaignId yet)
  // The cron runs every 5 min â€” this is the only way orders reach gamerz360
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
    take: 10, // process max 10 at once â€” keeps Turso write pressure low
  });

  if (due.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No scheduled orders due' });
  }

  // durationMinutes is a guarded column (not in the Prisma model) — raw-read it for
  // the due orders so we can forward the live-watch time to gamerz360.
  const watchMinsById = new Map<string, number>();
  try {
    const ids = due.map(o => o.id);
    const r = await sabiExecute({
      sql: `SELECT id, durationMinutes FROM SabiOrder WHERE id IN (${ids.map(() => '?').join(',')})`,
      args: ids,
    });
    for (const row of (r.rows as any[])) {
      const m = Number(row.durationMinutes);
      if (Number.isFinite(m) && m > 0) watchMinsById.set(String(row.id), m);
    }
  } catch {/* column may not exist yet — non-fatal */}

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

      // ── ATOMIC CLAIM ── flip pending → processing; only the winner proceeds. This is
      // what stops two overlapping cron runs from BOTH pushing + refunding the same
      // order (the double-refund that inflated balances / drove totalSpent negative).
      const claim = await prisma.sabiOrder.updateMany({
        where: { id: order.id, status: 'pending' },
        data: { status: 'processing' },
      });
      if (claim.count !== 1) { continue; } // another run already claimed it

      const payload = {
        sabiOrderId: order.id,
        serviceType: order.serviceType,
        targetUrl: order.targetUrl,
        quantity: order.quantity,
        totalPrice: order.totalPrice,
        // Custom-comment orders are priced at ₦150/comment (15000 kobo) — flag them so
        // gamerz360 pays taskers the custom-comment rate (200 pts each).
        isCustomComments: order.pricePerUnit === 15000,
        // Refill orders carry customRef "refill:<parentId>" — forward the parent so
        // gamerz360 links it AND blocks anyone who did the parent (fresh taskers only).
        refillOfOrderId: typeof order.customRef === 'string' && order.customRef.startsWith('refill:')
          ? order.customRef.slice('refill:'.length) : undefined,
        // Live-watch services: minutes the viewer must watch. gamerz360 turns this into
        // a tranche task and pays the tasker 20 pts/min in 10-min blocks.
        watchMinutes: watchMinsById.get(order.id) || undefined,
        // Structured audience targeting — gamerz360 gates task visibility to taskers
        // matching this gender + region (and refunds if none exist there).
        audienceGender: order.audienceGender || null,
        audienceLocation: order.audienceLocation || null,
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

      // 15s per-order timeout so one slow/hung call (e.g. Cloudflare challenge)
      // can't eat the whole 25s function budget and leave EVERY order pending.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      let response: Response;
      try {
        response = await fetch(`${gamerz360ApiUrl}/api/admin/sabi/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${integrationToken}`,
            // CRITICAL: Cloudflare fronts gamerz360.com and challenges non-browser
            // User-Agents — without this the call hangs/blocks and the order is
            // never submitted (stuck 'pending'). Auth is still the Bearer token.
            'User-Agent': 'Mozilla/5.0 (compatible; SABI-Integration/1.0)',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

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
        // Refund and fail. If gamerz360 rejected because we have no taskers in the
        // targeted gender/region, store its advisory message as the refund reason so
        // the buyer sees exactly why and is told to re-order with "All Nigeria".
        let reason = `gamerz360 returned ${response.status}`;
        try {
          const errBody = await response.json();
          if (errBody?.code === 'no_taskers_in_region' && errBody?.error) reason = String(errBody.error);
          else if (errBody?.error) reason = String(errBody.error);
        } catch {}
        // Refund ONLY if we win the processing → failed transition, so it can never
        // happen twice (the double-refund guard). The amount = exactly what was charged
        // (base + fee − discount = chargeKobo).
        const amt = order.totalPrice + order.platformFee - (order.discountAmount || 0);
        const failWin = await prisma.sabiOrder.updateMany({
          where: { id: order.id, status: 'processing' },
          data: { status: 'failed', refundReason: reason },
        });
        if (failWin.count === 1 && amt > 0) {
          // Credit + ledger in one atomic step. The failWin guard above makes this
          // run exactly once, so it can never double-refund.
          await creditSabiRefund({ userId: order.userId, amountKobo: amt, orderId: order.id, reason: reason || 'Order failed — full refund' });
        }
        results.push({ id: order.id, success: false, error: reason });
      }
    } catch (err: any) {
      // Timeout / network error — the push likely didn't complete. Revert our claim so
      // it retries next run. NO refund here (that only happens on an explicit rejection).
      await prisma.sabiOrder.updateMany({ where: { id: order.id, status: 'processing' }, data: { status: 'pending' } }).catch(() => {});
      results.push({ id: order.id, success: false, error: err?.message });
    }
  }

  const succeeded = results.filter(r => r.success).length;
  console.log(`[CRON] Processed ${due.length} scheduled orders: ${succeeded} succeeded`);

  return NextResponse.json({ processed: due.length, succeeded, results });
}
