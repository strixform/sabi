import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { prisma } from '@/lib/prisma';
import { computePricing } from '@/lib/servicesCatalog';
export const maxDuration = 15;


// Validate a promo code at checkout
export async function POST(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code, serviceId, quantity } = await req.json();
  if (!code || !serviceId || !quantity) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const promo = await prisma.sabiPromoCode.findUnique({
    where: { code: code.toUpperCase().trim() },
    include: { usages: { where: { userId: session.id } } },
  });

  if (!promo || !promo.active) return NextResponse.json({ error: 'Invalid or expired code' }, { status: 404 });
  if (promo.expiresAt && promo.expiresAt < new Date()) return NextResponse.json({ error: 'Code has expired' }, { status: 400 });
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return NextResponse.json({ error: 'Code usage limit reached' }, { status: 400 });
  if (promo.usages.length > 0) return NextResponse.json({ error: 'You have already used this code' }, { status: 400 });

  // Calculate discount
  const { getServiceById } = await import('@/lib/servicesCatalog');
  const svc = getServiceById(serviceId);
  if (!svc) return NextResponse.json({ error: 'Service not found' }, { status: 400 });

  const pricing = computePricing(svc.pricePerUnit, quantity);
  const baseKobo = pricing.baseKobo;

  if (baseKobo < promo.minOrderKobo) {
    const minNaira = Math.round(promo.minOrderKobo / 100);
    return NextResponse.json({ error: `Minimum order of ₦${minNaira.toLocaleString()} required for this code` }, { status: 400 });
  }

  const discountKobo = promo.discountType === 'percent'
    ? Math.round(baseKobo * promo.discountValue / 100)
    : promo.discountValue;

  const savedKobo = Math.min(discountKobo, pricing.totalKobo); // can't save more than total

  return NextResponse.json({
    valid: true,
    promoId: promo.id,
    code: promo.code,
    description: promo.description,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    savedKobo,
    savedNaira: (savedKobo / 100).toFixed(2),
    newTotalKobo: pricing.totalKobo - savedKobo,
  });
}
