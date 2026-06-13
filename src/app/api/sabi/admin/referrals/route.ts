/**
 * SABI Admin — Referral / affiliate program overview
 * GET /api/sabi/admin/referrals
 *
 * Returns all referral records with referrer details, conversion status,
 * and earnings. Mirrors the Owlet admin Affiliates tab.
 *
 * Auth: checkSabiAdmin (session cookie OR x-admin-token header)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';

export const preferredRegion = 'sfo1';
export const maxDuration = 15;

const REWARD_NAIRA = 100; // ₦100 per qualifying referral (referrer capped at 3)

export async function GET(req: NextRequest) {
  if (!await checkSabiAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch all referral records with both referrer and referee details
  const referrals = await prisma.sabiReferral.findMany({
    orderBy: { createdAt: 'desc' },
  }).catch(() => []);

  if (!referrals.length) {
    return NextResponse.json({ success: true, referrers: [], total: 0 });
  }

  // Collect all unique user IDs involved
  const allUserIds = [...new Set([
    ...referrals.map(r => r.referrerId),
    ...referrals.map(r => r.refereeId),
  ])];

  const users = await prisma.sabiUser.findMany({
    where: { id: { in: allUserIds } },
    select: { id: true, email: true, name: true, createdAt: true },
  }).catch(() => []);
  const userMap = new Map(users.map(u => [u.id, u]));

  // Group referrals by referrer to build per-user affiliate rows
  const referrerMap = new Map<string, {
    userId: string; email: string; name: string;
    registrations: number; qualified: number; paid: number;
    totalEarnings: number; availableEarnings: number;
  }>();

  for (const r of referrals) {
    const referrer = userMap.get(r.referrerId);
    if (!referrerMap.has(r.referrerId)) {
      referrerMap.set(r.referrerId, {
        userId:            r.referrerId,
        email:             referrer?.email ?? '—',
        name:              referrer?.name  ?? '—',
        registrations:     0,
        qualified:         0,
        paid:              0,
        totalEarnings:     0,
        availableEarnings: 0,
      });
    }
    const row = referrerMap.get(r.referrerId)!;
    row.registrations += 1;
    if (r.triggeredAt) row.qualified += 1;
    if (r.referrerPaid) {
      row.paid += 1;
      row.totalEarnings     += REWARD_NAIRA;
      row.availableEarnings += REWARD_NAIRA;
    }
  }

  // Summary stats
  const totalReferrers   = referrerMap.size;
  const totalReferrals   = referrals.length;
  const totalQualified   = referrals.filter(r => r.triggeredAt).length;
  const totalPaid        = referrals.filter(r => r.referrerPaid).length;
  const totalPaidOut     = totalPaid * REWARD_NAIRA;

  return NextResponse.json({
    success: true,
    stats: { totalReferrers, totalReferrals, totalQualified, totalPaid, totalPaidOut },
    referrers: [...referrerMap.values()].sort((a, b) => b.totalEarnings - a.totalEarnings),
    total: totalReferrers,
  });
}
