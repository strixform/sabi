import { NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { prisma } from '@/lib/prisma';

// GET: return the current user's referral code + stats
export async function GET() {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.sabiUser.findUnique({
    where: { id: session.id },
    select: { referralCode: true, name: true },
  });

  // Count how many people they referred + how many rewards paid
  const referrals = await prisma.sabiReferral.findMany({
    where: { referrerId: session.id },
    select: { referrerPaid: true, refereePaid: true, triggeredAt: true },
  });

  const totalReferred = referrals.length;
  const totalEarned = referrals.filter(r => r.referrerPaid).length * 500; // ₦500 per referral

  return NextResponse.json({
    success: true,
    referralCode: user?.referralCode,
    referralLink: `https://sability.io/sabi/register?ref=${user?.referralCode}`,
    totalReferred,
    totalEarned,
    pendingRewards: referrals.filter(r => r.triggeredAt && !r.referrerPaid).length,
  });
}
