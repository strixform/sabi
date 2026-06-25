import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { createSabiOrder } from '@/lib/sabiOrderEngine';
import { getService } from '@/lib/sabiServices';
import { getRateLimitKey, checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import crypto from 'crypto';

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
    durationMinutes, startScreenshotUrl, startCount,
  } = body;
  const dripDays = parseInt(body.dripDays);
  const qty = parseInt(quantity);

  if (!serviceId || !qty || !targetUrl) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!Number.isFinite(dripDays) || dripDays < 2 || dripDays > 30) {
    return NextResponse.json({ error: 'Number of drips must be between 2 and 30' }, { status: 400 });
  }
  // How far apart each drip goes out. Defaults to 24h (the old daily behaviour) but
  // the buyer can pick any gap — e.g. every 1h for faster pacing, every 12h, etc.
  // Clamped to a sane 1–168h (1 week) window.
  const dripIntervalHours = Math.min(168, Math.max(1, Number(body.dripIntervalHours) || 24));

  const service = getService(serviceId);
  if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 400 });

  // Each slice must still meet the service minimum.
  if (Math.floor(qty / dripDays) < service.minQuantity) {
    return NextResponse.json({
      error: `Each drip must be at least ${service.minQuantity}. Reduce the number of drips or increase quantity.`,
    }, { status: 400 });
  }

  // Split quantity as evenly as possible (earlier drips get the remainder).
  const base = Math.floor(qty / dripDays);
  const remainder = qty - base * dripDays;
  const slices = Array.from({ length: dripDays }, (_, i) => base + (i < remainder ? 1 : 0));

  const now = Date.now();
  const intervalMs = dripIntervalHours * 60 * 60 * 1000;
  // Delivery mode:
  //  • 'completion' (default): release the next drip when the previous one finishes.
  //    All slices are created+charged upfront; slices 1..N-1 are HELD with a far-future
  //    scheduledAt and released (scheduledAt → now) by the completion hook.
  //  • 'time': each drip goes out on a fixed schedule (every dripIntervalHours).
  const dripMode: 'completion' | 'time' = body.dripMode === 'time' ? 'time' : 'completion';
  const HELD_FUTURE = new Date('2099-01-01T00:00:00Z'); // parked until the prior slice completes
  const dripChainId = crypto.randomUUID();
  const created: string[] = [];
  let firstError: string | undefined;

  for (let i = 0; i < slices.length; i++) {
    // Slice 0 always goes out now. For the rest: 'time' schedules by interval;
    // 'completion' parks them (far future) until the prior slice completes.
    const scheduledAt = i === 0
      ? undefined
      : dripMode === 'time' ? new Date(now + i * intervalMs) : HELD_FUTURE;
    const result = await createSabiOrder({
      userId: session.id,
      serviceId,
      targetUrl,
      quantity: slices[i],
      paymentMethod: paymentMethod || 'flutterwave',
      audienceGender, audienceLocation, commentGender, commentInstructions,
      durationMinutes: durationMinutes !== undefined && durationMinutes !== null ? Number(durationMinutes) : undefined,
      scheduledAt,
      dripChainId, dripIndex: i, dripTotal: slices.length, dripMode,
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
