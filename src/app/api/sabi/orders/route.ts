import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { createSabiOrder, getSabiOrders, getSabiOrder } from '@/lib/sabiOrderEngine';
import { getCachedOrders, setCachedOrders } from '@/lib/redis';
import { getRateLimitKey, checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const maxDuration = 30;
export const preferredRegion = 'sfo1'; // Turso DB in Oregon (sfo1) — keeps latency minimal // Give enough time for gamerz360 round-trip

export async function GET(req: NextRequest) {
  try {
    const session = await getSabiSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Single-order fetch (?id=…) — used by the order detail page. Must return the
    // requested order, not the most recent one. Bypasses the list cache.
    const id = req.nextUrl.searchParams.get('id');
    if (id) {
      const order = await getSabiOrder(id, session.id);
      return NextResponse.json({ success: true, orders: order ? [order] : [] });
    }

    // Try cache first (5 minute TTL) — but never serve a cached EMPTY list, so a
    // transient miss can't hide a user's orders for 5 minutes.
    const cachedData = await getCachedOrders(session.id);
    if (cachedData && cachedData.length > 0) {
      return NextResponse.json({ success: true, orders: cachedData, cached: true });
    }

    const orders = await getSabiOrders(session.id);

    // Only cache non-empty results.
    if (orders.length > 0) await setCachedOrders(session.id, orders, 300);

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
    const session = await getSabiSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      serviceId, quantity, targetUrl, paymentMethod,
      audienceGender, audienceLocation, commentGender, commentInstructions,
      promoCodeId, discountAmount, scheduledAt, startScreenshotUrl, startCount,
    } = body;

    if (!serviceId || !quantity || !targetUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await createSabiOrder({
      userId: session.id,
      serviceId,
      targetUrl,
      quantity: parseInt(quantity),
      paymentMethod: paymentMethod || 'flutterwave',
      audienceGender,
      audienceLocation,
      commentGender,
      commentInstructions,
      promoCodeId: promoCodeId || undefined,
      discountAmount: discountAmount ? Number(discountAmount) : undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      startScreenshotUrl: startScreenshotUrl || undefined,
      startCount: (startCount !== undefined && startCount !== null && startCount !== '' && Number.isFinite(Number(startCount))) ? Number(startCount) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Order error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
