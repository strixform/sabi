import { NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { prisma } from '@/lib/prisma';

// GET: return the current user's referral code + full stats + per-referral breakdown
export async function GET() {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.sabiUser.findUnique({
    where: { id: session.id },
    select: { referralCode: true, name: true },
  });

  // Full referral breakdown — who signed up, who qualified, who earned
  const referrals = await prisma.sabiReferral.findMany({
    where: { referrerId: session.id },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch referee names/emails for display (masked for privacy)
  const refereeIds = referrals.map(r => r.refereeId);
  const referees = refereeIds.length
    ? await prisma.sabiUser.findMany({
        where: { id: { in: refereeIds } },
        select: { id: true, name: true, email: true, createdAt: true },
      })
    : [];
  const refereeMap = new Map(referees.map(u => [u.id, u]));

  const REWARD_NAIRA = 500;
  const paid = referrals.filter(r => r.referrerPaid);
  const pending = referrals.filter(r => r.triggeredAt && !r.referrerPaid);

  return NextResponse.json({
    success: true,
    referralCode: user?.referralCode,
    referralLink: `https://sability.io/sabi/register?ref=${user?.referralCode}`,
    stats: {
      totalReferred: referrals.length,
      qualified: referrals.filter(r => r.triggeredAt !== null).length,
      totalEarned: paid.length * REWARD_NAIRA,
      pendingEarnings: pending.length * REWARD_NAIRA,
      rewardPerReferral: REWARD_NAIRA,
    },
    referrals: referrals.map(r => {
      const referee = refereeMap.get(r.refereeId);
      // Mask email: jo***@gmail.com
      const maskedEmail = referee?.email
        ? referee.email.replace(/^(.{2})(.*)(@.+)$/, (_, a, _b, c) => `${a}***${c}`)
        : '—';
      return {
        id: r.id,
        name: referee?.name || 'Unknown',
        email: maskedEmail,
        joinedAt: referee?.createdAt || r.createdAt,
        qualifiedAt: r.triggeredAt,
        earned: r.referrerPaid ? REWARD_NAIRA : 0,
        // waiting = signed up but no order yet | pending = ordered, reward not yet cleared | paid
        status: r.referrerPaid ? 'paid' : r.triggeredAt ? 'pending' : 'waiting',
      };
    }),
  });
}
