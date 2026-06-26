import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { sabiExecute } from '@/lib/tursoClient';
import { createRefillRequest, getRefillForOrder } from '@/lib/sabiRefills';

export const maxDuration = 15;
export const preferredRegion = 'sfo1';

// Refills unlock 36h after purchase (gives staff time to flag/strip wrong proofs).
const REFILL_DELAY_MS = 36 * 60 * 60 * 1000;

/**
 * GET  /api/sabi/orders/[id]/refill  → current refill request status for this order
 * POST /api/sabi/orders/[id]/refill  → request a refill (admin-moderated)
 *   body: { quantity, reason? }
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  // ownership + age (for the 36h unlock)
  const own = await sabiExecute({ sql: `SELECT createdAt FROM SabiOrder WHERE id = ? AND userId = ? LIMIT 1`, args: [id, session.id] });
  if (own.rows.length === 0) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const createdAt = (own.rows[0] as any)?.createdAt;
  const unlockAt = createdAt ? new Date(new Date(createdAt).getTime() + REFILL_DELAY_MS).toISOString() : null;
  const refillUnlocked = unlockAt ? Date.now() >= new Date(unlockAt).getTime() : true;

  const request = await getRefillForOrder(id).catch(() => null);
  return NextResponse.json({ success: true, request, refillUnlocked, unlockAt });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const quantity = parseInt(body.quantity);
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 300) : '';

  // Verify ownership + pull order details (raw — resilient to schema lag).
  const r = await sabiExecute({
    sql: `SELECT serviceType, targetUrl, quantity, status, createdAt FROM SabiOrder WHERE id = ? AND userId = ? LIMIT 1`,
    args: [id, session.id],
  });
  const order = r.rows[0] as any;
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  if (order.status !== 'completed' && order.status !== 'executing') {
    return NextResponse.json({ error: 'You can only request a refill on a delivered order.' }, { status: 400 });
  }
  // Refills open 36h after purchase — that window lets us verify every proof and
  // strip points from any wrong ones first, so a refill only ever goes to NEW taskers.
  const ageMs = Date.now() - new Date(order.createdAt).getTime();
  if (Number.isFinite(ageMs) && ageMs < REFILL_DELAY_MS) {
    const hrsLeft = Math.ceil((REFILL_DELAY_MS - ageMs) / 3600000);
    return NextResponse.json({ error: `Refills open 36 hours after purchase (we verify delivery first). Available in about ${hrsLeft}h.` }, { status: 400 });
  }
  // Mutually exclusive with a shortfall refund.
  try {
    const claimed = await sabiExecute({ sql: `SELECT orderId FROM SabiShortfallClaim WHERE orderId = ? LIMIT 1`, args: [id] });
    if (claimed.rows.length > 0) {
      return NextResponse.json({ error: 'You already claimed an under-delivery refund for this order.' }, { status: 400 });
    }
  } catch { /* ledger table may not exist yet — no claim possible */ }
  if (!Number.isFinite(quantity) || quantity < 1) {
    return NextResponse.json({ error: 'Enter how many you need refilled.' }, { status: 400 });
  }
  // Can't refill more than was originally ordered.
  if (quantity > Number(order.quantity)) {
    return NextResponse.json({ error: `Refill can't exceed the original order quantity (${Number(order.quantity).toLocaleString()}).` }, { status: 400 });
  }

  const result = await createRefillRequest({
    orderId: id,
    userId: session.id,
    serviceType: order.serviceType,
    targetUrl: order.targetUrl,
    refillQuantity: quantity,
    reason,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  // Notify admin (fire-and-forget).
  import('@/lib/email').then(({ sendAdminRefillRequestEmail }) => {
    if (sendAdminRefillRequestEmail) sendAdminRefillRequestEmail(id, order.serviceType, quantity, reason).catch(() => {});
  }).catch(() => {});

  return NextResponse.json({ success: true, request: result.request });
}
