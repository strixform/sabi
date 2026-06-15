import { NextRequest, NextResponse } from 'next/server';
import { allowOwnerOrStaff, logStaffAction } from '@/lib/sabiStaff';
import { prisma } from '@/lib/prisma';
import { listRefills, getRefill, resolveRefill } from '@/lib/sabiRefills';
import { getService } from '@/lib/sabiServices';
import { computePricing } from '@/lib/servicesCatalog';

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
    return NextResponse.json({ success: true, refills: await listRefills(status) });
  } catch {
    return NextResponse.json({ success: true, refills: [] });
  }
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

  if (action === 'approve') {
    const service = getService(reqRow.serviceType);
    const pricePerUnit = service?.pricePerUnit ?? 0;
    const pricing = computePricing(pricePerUnit, reqRow.refillQuantity);
    // Create a FREE top-up order — buyer not debited. Cron pushes it to gamers360.
    const order = await prisma.sabiOrder.create({
      data: {
        userId: reqRow.userId,
        serviceType: reqRow.serviceType,
        targetUrl: reqRow.targetUrl,
        quantity: reqRow.refillQuantity,
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
  logStaffAction(auth.email || 'owner', `refill:${action}`, reqRow.orderId, note);

  // Notify the buyer (fire-and-forget).
  prisma.sabiUser.findUnique({ where: { id: reqRow.userId }, select: { email: true, name: true, notifyEmail: true } })
    .then(async (u) => {
      if (!u?.notifyEmail) return;
      const { sendRefillResolvedEmail } = await import('@/lib/email');
      sendRefillResolvedEmail(u.email, u.name, reqRow.orderId, action === 'approve', reqRow.refillQuantity, note);
    }).catch(() => {});

  return NextResponse.json({ success: true, action, refillOrderId });
}
