import { NextRequest, NextResponse } from 'next/server';
import { allowOwnerOrStaff, logStaffAction } from '@/lib/sabiStaff';
import { prisma } from '@/lib/prisma';
import { listRefills, getRefill, resolveRefill } from '@/lib/sabiRefills';
import { getService } from '@/lib/sabiServices';
import { computePricing } from '@/lib/servicesCatalog';
import { sabiExecute } from '@/lib/tursoClient';

export const maxDuration = 20;
export const preferredRegion = 'sfo1';

/**
 * GET  /api/sabi/admin/refills?status=pending  → list refill requests
 * POST /api/sabi/admin/refills  body { id, action: 'approve'|'reject', note? }
 *   approve → creates a FREE top-up order (buyer not charged; gamers360 campaign
 *   still budgeted so taskers are paid). The cron submits it like any order.
 */
export async function GET(req: NextRequest) {
  if (!(await allowOwnerOrStaff(req)).ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const status = req.nextUrl.searchParams.get('status') || undefined;
  try {
    const refills = await listRefills(status);
    // Enrich each refill with its ORIGINAL order's baseline + purchase quantity so
    // staff can see the start count + before-shot, what was bought, and the expected
    // final count — then decide the top-up amount before approving.
    const orderIds = [...new Set(refills.map((r: any) => r.orderId).filter(Boolean))] as string[];
    const byId = new Map<string, any>();
    if (orderIds.length) {
      const rows = await sabiExecute({
        sql: `SELECT id, quantity, completedQuantity, startCount, startScreenshotUrl FROM SabiOrder WHERE id IN (${orderIds.map(() => '?').join(',')})`,
        args: orderIds,
      }).catch(() => ({ rows: [] as any[] }));
      for (const o of rows.rows as any[]) byId.set(String(o.id), o);
    }
    const enriched = refills.map((r: any) => {
      const o = byId.get(String(r.orderId)) || {};
      const startCount = o.startCount === null || o.startCount === undefined ? null : Number(o.startCount);
      const originalQuantity = o.quantity === null || o.quantity === undefined ? null : Number(o.quantity);
      return {
        ...r,
        startCount,
        startScreenshotUrl: o.startScreenshotUrl || null,
        originalQuantity,
        completedQuantity: o.completedQuantity === null || o.completedQuantity === undefined ? null : Number(o.completedQuantity),
        estimatedCount: startCount != null && originalQuantity != null ? startCount + originalQuantity : null,
      };
    });
    return NextResponse.json({ success: true, refills: enriched });
  } catch {
    return NextResponse.json({ success: true, refills: [] });
  }
}

/**
 * PUT /api/sabi/admin/refills  body { orderId, quantity }
 * Staff DIRECTLY create a refill for an order (no buyer request needed). Free
 * top-up — buyer not charged; pushed to gamerz360 as a linked refill campaign
 * that reaches fresh taskers.
 */
export async function PUT(req: NextRequest) {
  const auth = await allowOwnerOrStaff(req);
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const orderId = String(body.orderId || '').trim();
  const quantity = Math.floor(Number(body.quantity) || 0);
  if (!orderId || quantity < 1) return NextResponse.json({ error: 'Order ID and a positive quantity are required.' }, { status: 400 });

  const orig = await prisma.sabiOrder.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, serviceType: true, targetUrl: true },
  });
  if (!orig) return NextResponse.json({ error: `Order ${orderId} not found.` }, { status: 404 });

  const service = getService(orig.serviceType);
  const pricePerUnit = service?.pricePerUnit ?? 0;
  const pricing = computePricing(pricePerUnit, quantity);
  const order = await prisma.sabiOrder.create({
    data: {
      userId: orig.userId,
      serviceType: orig.serviceType,
      targetUrl: orig.targetUrl,
      quantity,
      pricePerUnit,
      totalPrice: pricing.baseKobo,
      platformFee: pricing.platformFeeKobo + pricing.vatKobo,
      paymentMethod: 'refill',
      orderedVia: 'web',
      customRef: `refill:${orderId}`,
      discountAmount: pricing.totalKobo,
      status: 'pending',
    },
  });
  logStaffAction(auth.email || 'owner', 'refill:create-direct', orderId, `+${quantity}`);

  return NextResponse.json({
    success: true, refillOrderId: order.id, quantity,
    message: `Refill of +${quantity.toLocaleString()} created for order ${orderId}. It will be pushed to fresh taskers shortly.`,
  });
}

export async function POST(req: NextRequest) {
  const auth = await allowOwnerOrStaff(req);
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || '');
  const action = body.action === 'approve' ? 'approve' : body.action === 'reject' ? 'reject' : null;
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 300) : '';
  if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 });

  const reqRow = await getRefill(id);
  if (!reqRow) return NextResponse.json({ error: 'Refill request not found' }, { status: 404 });
  if (reqRow.status !== 'pending') return NextResponse.json({ error: `Already ${reqRow.status}` }, { status: 400 });

  let refillOrderId: string | undefined;

  // Staff decide the EXACT top-up to approve (defaults to what the buyer requested).
  const qtyOverride = Math.floor(Number(body.quantity) || 0);
  const approvedQty = qtyOverride > 0 ? qtyOverride : reqRow.refillQuantity;

  if (action === 'approve') {
    const service = getService(reqRow.serviceType);
    const pricePerUnit = service?.pricePerUnit ?? 0;
    const pricing = computePricing(pricePerUnit, approvedQty);
    // Create a FREE top-up order — buyer not debited. Cron pushes it to gamers360.
    const order = await prisma.sabiOrder.create({
      data: {
        userId: reqRow.userId,
        serviceType: reqRow.serviceType,
        targetUrl: reqRow.targetUrl,
        quantity: approvedQty,
        pricePerUnit,
        totalPrice: pricing.baseKobo,       // budget for taskers (platform absorbs it)
        platformFee: pricing.platformFeeKobo + pricing.vatKobo,
        paymentMethod: 'refill',
        orderedVia: 'web',
        customRef: `refill:${reqRow.orderId}`,
        discountAmount: pricing.totalKobo,  // record the full value as "discounted" — buyer paid nothing
        status: 'pending',
      },
    });
    refillOrderId = order.id;
  }

  await resolveRefill(id, action === 'approve' ? 'approved' : 'rejected', note, refillOrderId);
  logStaffAction(auth.email || 'owner', `refill:${action}`, reqRow.orderId, action === 'approve' ? `+${approvedQty}${note ? ` · ${note}` : ''}` : note);

  // Notify the buyer (fire-and-forget).
  prisma.sabiUser.findUnique({ where: { id: reqRow.userId }, select: { email: true, name: true, notifyEmail: true } })
    .then(async (u) => {
      if (!u?.notifyEmail) return;
      const { sendRefillResolvedEmail } = await import('@/lib/email');
      sendRefillResolvedEmail(u.email, u.name, reqRow.orderId, action === 'approve', approvedQty, note);
    }).catch(() => {});

  return NextResponse.json({ success: true, action, refillOrderId });
}
