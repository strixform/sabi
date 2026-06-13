import { NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 15;
export const preferredRegion = 'sfo1';

/**
 * GET /api/sabi/first-order
 * Returns whether the logged-in user is eligible for the first-order welcome
 * coupon (10% off, max ₦2,000). Eligible = no orders placed yet. The order
 * engine is authoritative and re-checks this server-side before charging.
 */
export async function GET() {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ eligible: false });
  try {
    const count = await prisma.sabiOrder.count({ where: { userId: session.id } });
    return NextResponse.json({ eligible: count === 0, discountRate: 0.10, maxKobo: 200000 });
  } catch {
    return NextResponse.json({ eligible: false });
  }
}
