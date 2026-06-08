/**
 * SABI Admin — Custom Order Requests
 *
 * GET  /api/sabi/admin/custom-requests   — list all requests (paginated, filterable)
 * PATCH /api/sabi/admin/custom-requests  — update status / admin notes on a request
 *
 * Auth: checkSabiAdmin (session cookie OR x-admin-token header)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';

export const preferredRegion = 'sfo1';
export const maxDuration = 15;

const VALID_STATUSES = ['new', 'reviewing', 'contacted', 'quoted', 'active', 'completed', 'rejected'] as const;

export async function GET(req: NextRequest) {
  if (!await checkSabiAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search')?.trim() || '';
  const limit  = Math.min(parseInt(searchParams.get('limit')  || '50'), 200);
  const offset = parseInt(searchParams.get('offset') || '0');

  const where: any = {};
  if (status && status !== 'all') where.status = status;
  if (search) {
    where.OR = [
      { name:        { contains: search } },
      { email:       { contains: search } },
      { whatsapp:    { contains: search } },
      { description: { contains: search } },
    ];
  }

  const [requests, total, counts] = await Promise.all([
    prisma.sabiCustomRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true, name: true, email: true, whatsapp: true,
        category: true, description: true, targetPlatform: true,
        targetUrl: true, quantity: true, budget: true, timeline: true,
        status: true, adminNotes: true, createdAt: true, userId: true,
      },
    }),
    prisma.sabiCustomRequest.count({ where }),
    // Status breakdown counts
    prisma.sabiCustomRequest.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
  ]);

  const statusCounts = Object.fromEntries(
    counts.map(c => [c.status, c._count._all])
  );

  return NextResponse.json({
    success: true,
    requests,
    total,
    statusCounts,
    limit,
    offset,
  });
}

export async function PATCH(req: NextRequest) {
  if (!await checkSabiAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, status, adminNotes } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const data: any = { updatedAt: new Date() };
  if (status)     data.status     = status;
  if (adminNotes !== undefined) data.adminNotes = adminNotes;

  const updated = await prisma.sabiCustomRequest.update({
    where: { id },
    data,
    select: { id: true, status: true, adminNotes: true },
  });

  return NextResponse.json({ success: true, request: updated });
}
