import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { sabiExecute } from '@/lib/tursoClient';
import { createRefillRequest, getRefillForOrder } from '@/lib/sabiRefills';

export const maxDuration = 15;
export const preferredRegion = 'sfo1';

/**
 * GET  /api/sabi/orders/[id]/refill  → current refill request status for this order
 * POST /api/sabi/orders/[id]/refill  → request a refill (admin-moderated)
 *   body: { quantity, reason? }
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  // ownership
  const own = await sabiExecute({ sql: `SELECT id FROM SabiOrder WHERE id = ? AND userId = ? LIMIT 1`, args: [id, session.id] });
  if (own.rows.length === 0) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const request = await getRefillForOrder(id).catch(() => null);
  return NextResponse.json({ success: true, request });
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
    sql: `SELECT serviceType, targetUrl, quantity, status FROM SabiOrder WHERE id = ? AND userId = ? LIMIT 1`,
    args: [id, session.id],
  });
  const order = r.rows[0] as any;
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  if (order.status !== 'completed' && order.status !== 'executing') {
    return NextResponse.json({ error: 'You can only request a refill on a delivered order.' }, { status: 400 });
  }
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
