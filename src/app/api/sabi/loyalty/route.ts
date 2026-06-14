import { NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { prisma } from '@/lib/prisma';
import { loyaltyTier, LOYALTY_TIERS } from '@/lib/sabiPerks';

export const maxDuration = 15;
export const preferredRegion = 'sfo1';

/** GET /api/sabi/loyalty → the user's VIP tier, discount, and progress. */
export async function GET() {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const w = await prisma.sabiWallet.findUnique({ where: { userId: session.id }, select: { totalSpent: true } });
    const totalSpent = w?.totalSpent || 0;
    const { tier, next, toNextKobo } = loyaltyTier(totalSpent);
    return NextResponse.json({
      success: true,
      totalSpentKobo: totalSpent,
      tier: tier.name,
      icon: tier.icon,
      discountRate: tier.rate,
      next: next ? { name: next.name, icon: next.icon, rate: next.rate, toNextNaira: Math.round(toNextKobo / 100) } : null,
      tiers: LOYALTY_TIERS.map(t => ({ name: t.name, icon: t.icon, rate: t.rate, minNaira: Math.round(t.minSpentKobo / 100) })),
    });
  } catch {
    return NextResponse.json({ success: true, tier: 'Bronze', discountRate: 0, totalSpentKobo: 0, next: null });
  }
}
