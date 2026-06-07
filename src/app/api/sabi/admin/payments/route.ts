/**
 * SABI Admin — Payments / transaction history
 * GET /api/sabi/admin/payments
 *
 * Returns all wallet transactions (top-ups, bonuses, refunds, order charges)
 * across all users. Mirrors the Owlet admin Payments tab.
 *
 * Auth: checkSabiAdmin (session cookie OR x-admin-token header)
 * Query params:
 *   search  — filter by user email / transaction ref
 *   type    — filter by type (deposit / order / refund / bonus)
 *   limit   — default 50, max 200
 *   offset  — pagination offset
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';

export const preferredRegion = 'sfo1';

export async function GET(req: NextRequest) {
  if (!await checkSabiAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim() || '';
  const type   = searchParams.get('type')   || '';
  const limit  = Math.min(parseInt(searchParams.get('limit')  || '50'),  200);
  const offset = parseInt(searchParams.get('offset') || '0');

  const where: any = {};
  if (type) where.type = type;
  if (search) {
    where.OR = [
      { reference:   { contains: search } },
      { description: { contains: search } },
    ];
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

  // Aggregate revenue stats for the header cards
  const [totalDeposited, totalSpent, totalRefunded] = await Promise.all([
    prisma.sabiTransaction.aggregate({ where: { type: 'deposit' }, _sum: { amount: true } }),
    prisma.sabiTransaction.aggregate({ where: { type: 'order'   }, _sum: { amount: true } }),
    prisma.sabiTransaction.aggregate({ where: { type: 'refund'  }, _sum: { amount: true } }),
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
      totalDeposited: totalDeposited._sum.amount ?? 0,
      totalSpent:     totalSpent._sum.amount     ?? 0,
      totalRefunded:  totalRefunded._sum.amount  ?? 0,
    },
    limit,
    offset,
  });
}
