import { NextRequest, NextResponse } from 'next/server';
import { resolveSabiCaller } from '@/lib/sabiApiAuth';
import { createSabiOrder, getSabiOrders, getSabiOrder } from '@/lib/sabiOrderEngine';
import { getCachedOrders, setCachedOrders } from '@/lib/redis';
import { getRateLimitKey, checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { getActingAccount, canSpend, logTeamAction } from '@/lib/sabiTeam';

export const maxDuration = 30;
export const preferredRegion = 'sfo1'; // Turso DB in Oregon (sfo1) — keeps latency minimal // Give enough time for gamerz360 round-trip

export async function GET(req: NextRequest) {
  try {
    const session = await resolveSabiCaller(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Operate on the active workspace (own account, or one switched into).
    const acct = await getActingAccount(session.id);

    // Single-order fetch (?id=…) — used by the order detail page. Must return the
    // requested order, not the most recent one. Bypasses the list cache.
    const id = req.nextUrl.searchParams.get('id');
    if (id) {
      const order = await getSabiOrder(id, acct.accountId);
      return NextResponse.json({ success: true, orders: order ? [order] : [] });
    }

    // Try cache first (5 minute TTL) — but never serve a cached EMPTY list, so a
    // transient miss can't hide a user's orders for 5 minutes.
    const cachedData = await getCachedOrders(acct.accountId);
    if (cachedData && cachedData.length > 0) {
      return NextResponse.json({ success: true, orders: cachedData, cached: true });
    }

    const orders = await getSabiOrders(acct.accountId);

    // Only cache non-empty results.
    if (orders.length > 0) await setCachedOrders(acct.accountId, orders, 300);

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // 20 orders per hour per IP â€” prevents wallet-drain spam
  const rl = await checkRateLimit(getRateLimitKey(req, 'order-create'), 20, 60 * 60000);
  if (!rl.allowed) return rateLimitResponse(20, rl.resetTime);

  try {
    const session = await resolveSabiCaller(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Resolve the active workspace. A view-only teammate cannot place orders.
    const acct = await getActingAccount(session.id);
    if (acct.delegated && !canSpend(acct.role)) {
      return NextResponse.json({ error: 'You have view-only access to this account and cannot place orders.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      serviceId, quantity, targetUrl, paymentMethod,
      audienceGender, audienceLocation, commentGender, commentInstructions,
      durationMinutes, customComments, voteChoice,
      promoCodeId, discountAmount, scheduledAt, startScreenshotUrl, startCount,
    } = body;

    if (!serviceId || !quantity || !targetUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await createSabiOrder({
      userId: acct.accountId,
      serviceId,
      targetUrl,
      quantity: parseInt(quantity),
      paymentMethod: paymentMethod || 'flutterwave',
      audienceGender,
      audienceLocation,
      commentGender,
      commentInstructions,
      voteChoice: voteChoice ? String(voteChoice) : undefined,
      durationMinutes: durationMinutes !== undefined && durationMinutes !== null ? Number(durationMinutes) : undefined,
      customComments: Array.isArray(customComments) ? customComments : undefined,
      promoCodeId: promoCodeId || undefined,
      discountAmount: discountAmount ? Number(discountAmount) : undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      startScreenshotUrl: startScreenshotUrl || undefined,
      startCount: (startCount !== undefined && startCount !== null && startCount !== '' && Number.isFinite(Number(startCount))) ? Number(startCount) : undefined,
    });

    if (acct.delegated && result?.success) {
      logTeamAction(acct.accountId, session.id, 'order:create', `${serviceId} ×${quantity} (${session.email})`).catch(() => {});
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Order error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
