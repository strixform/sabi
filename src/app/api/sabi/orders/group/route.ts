import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { createSabiOrder } from '@/lib/sabiOrderEngine';
import { getRateLimitKey, checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { getActingAccount, canSpend, logTeamAction } from '@/lib/sabiTeam';

export const maxDuration = 60; // multiple gamerz360 round-trips
export const preferredRegion = 'sfo1';

/**
 * GROUP ORDER — one link, many actions, placed together.
 *
 * The buyer picks a platform, pastes ONE link, and sets a quantity per action
 * (likes / comments / views / saves / shares / reposts / subs …), leaving any they
 * don't want at 0 (None). We then create a SEPARATE order per action via the normal
 * engine, so each gets its own order id, wallet debit, pricing, proof and gamerz360
 * campaign — nothing is mixed. Returns a per-action result breakdown.
 *
 * Body: { targetUrl, paymentMethod?, items:[{serviceId, quantity}],
 *         audienceGender?, audienceLocation?, startScreenshotUrl?, startCount? }
 */
export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(getRateLimitKey(req, 'order-group'), 10, 60 * 60000);
  if (!rl.allowed) return rateLimitResponse(10, rl.resetTime);

  try {
    const session = await getSabiSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const acct = await getActingAccount(session.id);
    if (acct.delegated && !canSpend(acct.role)) {
      return NextResponse.json({ error: 'You have view-only access to this account and cannot place orders.' }, { status: 403 });
    }

    const body = await req.json();
    const { targetUrl, paymentMethod, items, audienceGender, audienceLocation, startScreenshotUrl, startCount } = body;

    if (!targetUrl || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Provide a link and at least one action.' }, { status: 400 });
    }
    // Keep only the actions the buyer actually wants (quantity > 0 = not "None").
    const active = items
      .map((i: any) => ({
        serviceId: String(i.serviceId || ''),
        quantity: parseInt(i.quantity),
        // Per-action start count (current follower/like/etc. count) — optional, no screenshot.
        startCount: (i.startCount !== undefined && i.startCount !== null && i.startCount !== '' && Number.isFinite(Number(i.startCount))) ? Number(i.startCount) : undefined,
        // Per-action brief for comment services / target for vote services.
        commentInstructions: i.commentInstructions ? String(i.commentInstructions).slice(0, 1000) : undefined,
        voteChoice: i.voteChoice ? String(i.voteChoice).slice(0, 200) : undefined,
      }))
      .filter((i: { serviceId: string; quantity: number }) => i.serviceId && Number.isFinite(i.quantity) && i.quantity > 0);

    if (active.length === 0) {
      return NextResponse.json({ error: 'Set a quantity for at least one action (leave the rest at None).' }, { status: 400 });
    }

    const results: any[] = [];
    for (const it of active) {
      const r = await createSabiOrder({
        userId: acct.accountId,
        serviceId: it.serviceId,
        targetUrl,
        quantity: it.quantity,
        paymentMethod: paymentMethod || 'flutterwave',
        audienceGender,
        audienceLocation,
        startScreenshotUrl: startScreenshotUrl || undefined,
        startCount: it.startCount,
        commentInstructions: it.commentInstructions,
        voteChoice: it.voteChoice,
      }).catch((e: any) => ({ success: false, error: e?.message?.slice(0, 160) || 'Order failed' }));
      results.push({ serviceId: it.serviceId, quantity: it.quantity, ...r });
      if (acct.delegated && (r as any)?.success) {
        logTeamAction(acct.accountId, session.id, 'order:group', `${it.serviceId} ×${it.quantity} (${session.email})`).catch(() => {});
      }
    }

    const created = results.filter(r => r.success).length;
    const totalPrice = results.reduce((s, r) => s + (Number(r.totalPrice) || 0), 0);
    return NextResponse.json({
      success: created > 0,
      created, attempted: active.length,
      totalPrice,
      results,
      // If some failed (e.g. one action ran out of budget), the buyer sees exactly which.
      message: created === active.length
        ? `Placed ${created} order(s) for this link.`
        : `Placed ${created} of ${active.length} order(s). Check the ones that failed below.`,
    });
  } catch (error) {
    console.error('Group order error:', error);
    return NextResponse.json({ error: 'Could not place the group order.' }, { status: 500 });
  }
}
