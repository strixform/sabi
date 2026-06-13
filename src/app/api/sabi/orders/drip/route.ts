import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { createSabiOrder } from '@/lib/sabiOrderEngine';
import { getService } from '@/lib/sabiServices';
import { getRateLimitKey, checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const maxDuration = 30;
export const preferredRegion = 'sfo1';

/**
 * POST /api/sabi/orders/drip
 * Drip-feed delivery: split one order into `dripDays` daily slices, each
 * scheduled a day apart. Looks natural (no suspicious spikes) and reuses the
 * existing process-scheduled cron — each slice is a normal scheduled order.
 * The buyer is charged the same total (sum of slices); the placement email
 * fires only for the first slice.
 */
export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(getRateLimitKey(req, 'order-drip'), 10, 60 * 60000);
  if (!rl.allowed) return rateLimitResponse(10, rl.resetTime);

  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const {
    serviceId, quantity, targetUrl, paymentMethod,
    audienceGender, audienceLocation, commentGender, commentInstructions,
    startScreenshotUrl, startCount,
  } = body;
  const dripDays = parseInt(body.dripDays);
  const qty = parseInt(quantity);

  if (!serviceId || !qty || !targetUrl) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!Number.isFinite(dripDays) || dripDays < 2 || dripDays > 30) {
    return NextResponse.json({ error: 'Drip days must be between 2 and 30' }, { status: 400 });
  }

  const service = getService(serviceId);
  if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 400 });

  // Each daily slice must still meet the service minimum.
  if (Math.floor(qty / dripDays) < service.minQuantity) {
    return NextResponse.json({
      error: `Each day must be at least ${service.minQuantity}. Reduce the number of days or increase quantity.`,
    }, { status: 400 });
  }

  // Split quantity as evenly as possible (earlier days get the remainder).
  const base = Math.floor(qty / dripDays);
  const remainder = qty - base * dripDays;
  const slices = Array.from({ length: dripDays }, (_, i) => base + (i < remainder ? 1 : 0));

  const now = Date.now();
  const created: string[] = [];
  let firstError: string | undefined;

  for (let i = 0; i < slices.length; i++) {
    const scheduledAt = i === 0 ? undefined : new Date(now + i * 24 * 60 * 60 * 1000);
    const result = await createSabiOrder({
      userId: session.id,
      serviceId,
      targetUrl,
      quantity: slices[i],
      paymentMethod: paymentMethod || 'flutterwave',
      audienceGender, audienceLocation, commentGender, commentInstructions,
      scheduledAt,
      startScreenshotUrl: i === 0 ? (startScreenshotUrl || undefined) : undefined,
      startCount: i === 0 && startCount !== undefined && startCount !== null && startCount !== '' && Number.isFinite(Number(startCount)) ? Number(startCount) : undefined,
      silent: i > 0,
    });
    if (result.success && result.orderId) {
      created.push(result.orderId);
    } else {
      firstError = result.error;
      // Stop on first failure (e.g. insufficient funds) — partial drip is fine,
      // the buyer keeps the slices already placed.
      break;
    }
  }

  if (created.length === 0) {
    return NextResponse.json({ success: false, error: firstError || 'Could not place drip order' }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    orderIds: created,
    slices: slices.slice(0, created.length),
    days: created.length,
    partial: created.length < slices.length,
    note: firstError && created.length < slices.length ? `Placed ${created.length}/${dripDays} days — stopped: ${firstError}` : undefined,
  });
}
