/**
 * SABI Admin — Users list
 * GET /api/sabi/admin/users
 *
 * Returns all registered SABI users with their wallet balances, spend,
 * status and last session. Mirrors the Owlet admin Users tab.
 *
 * Auth: checkSabiAdmin (session cookie OR x-admin-token header)
 * Query params:
 *   search  — filter by username/email
 *   status  — filter by user status (active / banned)
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
  const status = searchParams.get('status') || '';
  const limit  = Math.min(parseInt(searchParams.get('limit')  || '50'),  200);
  const offset = parseInt(searchParams.get('offset') || '0');

  // Build filter — search across email and name
  const where: any = {};
  if (search) {
    where.OR = [
      { email: { contains: search } },
      { name:  { contains: search } },
    ];
  }
  if (status) where.status = status;

  const [users, total] = await Promise.all([
    prisma.sabiUser.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        sessionExpiry: true, // last auth proxy — most recent session
        wallet: {
          select: { balance: true, totalSpent: true, totalFunded: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.sabiUser.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    users: users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      status: u.status,
      emailVerified: u.emailVerified,
      balance:      u.wallet?.balance      ?? 0,  // kobo
      totalSpent:   u.wallet?.totalSpent   ?? 0,  // kobo
      totalFunded:  u.wallet?.totalFunded  ?? 0,  // kobo
      lastAuth:     u.sessionExpiry,               // most recent session expiry → proxy for last login
      createdAt:    u.createdAt,
    })),
    total,
    limit,
    offset,
  });
}
