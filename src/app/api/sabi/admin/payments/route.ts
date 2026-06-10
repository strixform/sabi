/**
 * SABI Admin — Incoming Payments (Flutterwave deposits only)
 * GET /api/sabi/admin/payments
 *
 * Returns only real incoming wallet top-ups from Flutterwave.
 * Excludes order charges, refunds, bonuses — those are internal movements.
 * This is the "money in" view: what users have actually paid into the platform.
 *
 * Auth: checkSabiAdmin (session cookie OR x-admin-token header)
 * Query params:
 *   search  — filter by user email / transaction ref
 *   limit   — default 50, max 200
 *   offset  — pagination offset
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';

export const preferredRegion = 'sfo1';
export const maxDuration = 15;

export async function GET(req: NextRequest) {
  if (!await checkSabiAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim() || '';
  const type   = searchParams.get('type')   || '';
  const limit  = Math.min(parseInt(searchParams.get('limit')  || '50'),  200);
  const offset = parseInt(searchParams.get('offset') || '0');

  // Always filter to fund transactions only — this page shows money IN (Flutterwave top-ups).
  // Order charges, refunds, bonuses are internal movements shown elsewhere.
  const where: any = { type: 'fund' };
  if (search) {
    where.AND = [{
      OR: [
        { reference:   { contains: search } },
        { description: { contains: search } },
        { user: { email: { contains: search } } },
      ],
    }];
  }

  const [txns, total] = await Promise.all([
    prisma.sabiTransaction.findMany({
      where,
      include: {
        user: { select: { email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.sabiTransaction.count({ where }),
  ]);

  // Stats cards — fund transactions only (this is the incoming money view)
  const [totalFunded, fundCount] = await Promise.all([
    prisma.sabiTransaction.aggregate({ where: { type: 'fund' }, _sum: { amount: true } }),
    prisma.sabiTransaction.count({ where: { type: 'fund' } }),
  ]);

  return NextResponse.json({
    success: true,
    transactions: txns.map(t => ({
      id:          t.id,
      userId:      t.userId,
      userEmail:   t.user?.email  ?? '—',
      userName:    t.user?.name   ?? '—',
      type:        t.type,        // deposit | order | refund | bonus
      amount:      t.amount,      // kobo
      reference:   t.reference,   // Flutterwave txRef or internal ref
      description: t.description,
      createdAt:   t.createdAt,
    })),
    total,
    stats: {
      totalFunded: totalFunded._sum.amount ?? 0,
      totalTransactions: fundCount,
    },
    limit,
    offset,
  });
  } catch (err: any) {
    console.error('[admin/payments]', err?.message?.slice(0, 200));
    return NextResponse.json({ error: 'Failed to load payments', detail: err?.message?.slice(0, 100) }, { status: 500 });
  }
}
