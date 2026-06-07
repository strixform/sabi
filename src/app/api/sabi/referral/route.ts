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

  // Full referral breakdown — wrapped in try/catch because SabiReferral table
  // may not exist in prod Turso (schema changes don't auto-migrate on Turso).
  // Gracefully return empty data rather than a 500 that crashes the dashboard.
  let referrals: any[] = [];
  let refereeMap = new Map<string, any>();
  try {
    referrals = await prisma.sabiReferral.findMany({
      where: { referrerId: session.id },
      orderBy: { createdAt: 'desc' },
    });

    const refereeIds = referrals.map((r: any) => r.refereeId);
    const referees = refereeIds.length
      ? await prisma.sabiUser.findMany({
          where: { id: { in: refereeIds } },
          select: { id: true, name: true, email: true, createdAt: true },
        })
      : [];
    refereeMap = new Map(referees.map((u: any) => [u.id, u]));
  } catch {
    // Table not yet migrated in prod — return empty state gracefully
  }

  const REWARD_NAIRA = 500;
  const paid = referrals.filter(r => r.referrerPaid);
  const pending = referrals.filter(r => r.triggeredAt && !r.referrerPaid);

  const totalEarned = paid.length * REWARD_NAIRA;
  const totalReferred = referrals.length;
  const pendingRewards = pending.length;

  return NextResponse.json({
    success: true,
    referralCode: user?.referralCode,
    referralLink: `https://sability.io/sabi/register?ref=${user?.referralCode}`,
    // Top-level fields kept for backward compat with dashboard page
    totalReferred,
    totalEarned,
    pendingRewards,
    // New stats object used by /sabi/referral page
    stats: {
      totalReferred,
      qualified: referrals.filter(r => r.triggeredAt !== null).length,
      totalEarned,
      pendingEarnings: pending.length * REWARD_NAIRA,
      rewardPerReferral: REWARD_NAIRA,
    },
    referrals: referrals.map(r => {
      const referee = refereeMap.get(r.refereeId);
      // Mask email: jo***@gmail.com
      const maskedEmail = referee?.email
        ? referee.email.replace(/^(.{2})(.*)(@.+)$/, (_: string, a: string, _b: string, c: string) => `${a}***${c}`)
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
