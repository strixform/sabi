import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
export const maxDuration = 15;
export const preferredRegion = 'sfo1'; // Turso DB in Oregon (sfo1) — keeps latency minimal


const requireAdmin = (req: NextRequest) => checkSabiAdmin(req);

// GET: list all promo codes â€” admin only
export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const promos = await prisma.sabiPromoCode.findMany({
    include: { _count: { select: { usages: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    success: true,
    promos: promos.map(p => ({
      id: p.id,
      code: p.code,
      description: p.description,
      discountType: p.discountType,
      discountValue: p.discountValue,
      minOrderKobo: p.minOrderKobo,
      maxUses: p.maxUses,
      usedCount: p.usedCount,
      usages: p._count.usages,
      expiresAt: p.expiresAt?.toISOString(),
      active: p.active,
      createdAt: p.createdAt.toISOString(),
    })),
  });
}

// POST: create a promo code â€” admin only
export async function POST(req: NextRequest) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { code, description, discountType, discountValue, minOrderNaira, maxUses, expiresAt } = body;

  if (!code || !discountType || !discountValue) {
    return NextResponse.json({ error: 'code, discountType, and discountValue required' }, { status: 400 });
  }
  if (!['percent', 'fixed'].includes(discountType)) {
    return NextResponse.json({ error: 'discountType must be percent or fixed' }, { status: 400 });
  }
  if (discountType === 'percent' && (discountValue < 1 || discountValue > 100)) {
    return NextResponse.json({ error: 'Percent discount must be 1-100' }, { status: 400 });
  }

  try {
    const promo = await prisma.sabiPromoCode.create({
      data: {
        code: code.toUpperCase().trim(),
        description: description || null,
        discountType,
        discountValue: Number(discountValue),
        minOrderKobo: Math.round((minOrderNaira || 0) * 100),
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active: true,
      },
    });
    return NextResponse.json({ success: true, promo });
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Code already exists' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create promo code' }, { status: 500 });
  }
}

// PATCH: toggle active â€” admin only
export async function PATCH(req: NextRequest) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id, active } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.sabiPromoCode.update({ where: { id }, data: { active: Boolean(active) } });
  return NextResponse.json({ success: true });
}

// DELETE: remove a promo code â€” admin only
export async function DELETE(req: NextRequest) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.sabiPromoCode.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
