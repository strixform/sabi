import { NextRequest, NextResponse } from 'next/server';
import { resolveSabiActor, apiRateLimit } from '@/lib/sabiApiAuth';
import { getActingAccount, canSpend } from '@/lib/sabiTeam';
import { getService } from '@/lib/sabiServices';
import { computeServicePricing } from '@/lib/servicesCatalog';
import { debitSabiWallet, refundSabiWallet } from '@/lib/sabiWallet';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Field-gig booking — the DEDICATED, money-safe path for real-world physical
 * gigs (mystery shopping, sampling, flyer distribution, …).
 *
 * Deliberately isolated from the normal order engine:
 *  - physical gigs have no target URL and must NOT auto-dispatch to online
 *    taskers (they can't verify a physical location), so they never touch
 *    validateOrder / the gamerz360 push cron.
 *  - orders are created with status 'field_pending' — the dispatch cron only
 *    processes 'pending', so these sit in a manual coordination queue instead.
 *  - money-safety mirrors createSabiOrder exactly: debit → create → refund on
 *    failure, so the buyer is never charged without an order.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await resolveSabiActor(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const arl = await apiRateLimit(session, 'order', 30, 60000);
    if (!arl.allowed) return NextResponse.json({ error: 'Too many requests — slow down a little.' }, { status: 429 });

    const acct = await getActingAccount(session.id);
    if (acct.delegated && !canSpend(acct.role)) {
      return NextResponse.json({ error: 'You have view-only access to this account and cannot place orders.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const serviceId = String(body.serviceId || '').trim();
    const state = String(body.state || '').trim().slice(0, 80);
    const city = String(body.city || '').trim().slice(0, 120);
    const taskBrief = String(body.taskBrief || '').trim().slice(0, 2000);
    const preferredDate = String(body.preferredDate || '').trim().slice(0, 60);
    const contact = String(body.contact || '').trim().slice(0, 120);
    const headcount = Math.floor(Number(body.headcount));

    // ── Validate ────────────────────────────────────────────────────────────
    const service = getService(serviceId);
    if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    // This endpoint is ONLY for real-world field gigs.
    if (service.category !== 'gigs') {
      return NextResponse.json({ error: 'This is not a field gig.' }, { status: 400 });
    }
    if (!Number.isFinite(headcount) || headcount < service.minQuantity) {
      return NextResponse.json({ error: `Minimum is ${service.minQuantity} ${service.minQuantity === 1 ? 'person/visit' : 'people/visits'}.` }, { status: 400 });
    }
    if (headcount > service.maxQuantity) {
      return NextResponse.json({ error: `Maximum is ${service.maxQuantity}.` }, { status: 400 });
    }
    if (!state) return NextResponse.json({ error: 'Please choose the state/location for this gig.' }, { status: 400 });
    if (taskBrief.length < 10) return NextResponse.json({ error: 'Please describe the task (at least a sentence).' }, { status: 400 });
    if (!contact) return NextResponse.json({ error: 'Please add a contact (WhatsApp/phone) so our team can coordinate.' }, { status: 400 });

    // ── Price (no promo/discount stack on physical gigs — keep it simple) ─────
    const pricing = computeServicePricing(service, headcount);
    const chargeKobo = pricing.totalKobo;
    const platformFee = pricing.platformFeeKobo + pricing.vatKobo;

    const user = await prisma.sabiUser.findUnique({ where: { id: acct.accountId }, select: { id: true } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // ── Debit FIRST, then create; refund if the create fails ────────────────
    const debit = await debitSabiWallet(acct.accountId, chargeKobo, '');
    if (!debit.success) {
      return NextResponse.json({ error: debit.error || 'Insufficient balance' }, { status: 400 });
    }

    const brief = [
      `📋 FIELD GIG: ${service.name}`,
      `📍 Location: ${state}${city ? `, ${city}` : ''}`,
      `🗓 Preferred: ${preferredDate || 'Flexible'}`,
      `👥 People/visits: ${headcount}`,
      `☎ Contact: ${contact}`,
      `📝 Task: ${taskBrief}`,
    ].join('\n');

    let order: { id: string };
    try {
      order = await prisma.sabiOrder.create({
        data: {
          userId: acct.accountId,
          serviceType: serviceId,
          targetUrl: `Field gig — ${state}${city ? `, ${city}` : ''}`,
          quantity: headcount,
          pricePerUnit: service.pricePerUnit,
          totalPrice: pricing.baseKobo,
          platformFee,
          paymentMethod: 'wallet',
          orderedVia: 'web',
          audienceLocation: `${state}${city ? `, ${city}` : ''}`,
          commentInstructions: brief,
          // Manual coordination queue — the dispatch cron only touches 'pending',
          // so this never auto-dispatches to online taskers.
          status: 'field_pending',
        },
        select: { id: true },
      });
    } catch (createErr) {
      console.error('[field-gigs] create failed after debit — refunding:', (createErr as Error)?.message);
      await refundSabiWallet(acct.accountId, chargeKobo, `field-fail-${Date.now()}`, 'Field-gig booking failed — auto refund').catch(() => {});
      return NextResponse.json({ error: 'Booking failed — your wallet was not charged.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, orderId: order.id, chargedKobo: chargeKobo });
  } catch (error) {
    console.error('Field-gig booking error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
