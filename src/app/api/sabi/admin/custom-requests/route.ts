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
import { allowOwnerOrStaff, logStaffAction } from '@/lib/sabiStaff';
import { sabiExecute } from '@/lib/tursoClient';

export const preferredRegion = 'sfo1';
export const maxDuration = 15;

const VALID_STATUSES = ['new', 'reviewing', 'contacted', 'quoted', 'active', 'completed', 'rejected'] as const;

export async function GET(req: NextRequest) {
  if (!(await allowOwnerOrStaff(req)).ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search')?.trim() || '';
  const limit  = Math.min(parseInt(searchParams.get('limit')  || '50'), 200);
  const offset = parseInt(searchParams.get('offset') || '0');

  // Raw SQL (SELECT *) instead of a Prisma `select`/`groupBy`. A single column that
  // lags behind the prod Turso schema makes the Prisma query throw, which silently
  // empties the whole list (the recurring SABI schema-lag bug). Raw returns whatever
  // columns actually exist, so the list can never disappear on a missing field.
  const conds: string[] = [];
  const args: any[] = [];
  if (status && status !== 'all') { conds.push('status = ?'); args.push(status); }
  if (search) {
    conds.push('(name LIKE ? OR email LIKE ? OR whatsapp LIKE ? OR description LIKE ?)');
    const like = `%${search}%`;
    args.push(like, like, like, like);
  }
  const whereSql = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

  try {
    const [rowsRes, totalRes, countRes] = await Promise.all([
      sabiExecute({ sql: `SELECT * FROM SabiCustomRequest ${whereSql} ORDER BY createdAt DESC LIMIT ? OFFSET ?`, args: [...args, limit, offset] }),
      sabiExecute({ sql: `SELECT COUNT(*) AS c FROM SabiCustomRequest ${whereSql}`, args }),
      sabiExecute({ sql: `SELECT status, COUNT(*) AS c FROM SabiCustomRequest GROUP BY status`, args: [] }),
    ]);
    const statusCounts = Object.fromEntries((countRes.rows as any[]).map(r => [r.status, Number(r.c)]));
    return NextResponse.json({
      success: true,
      requests: rowsRes.rows,
      total: Number((totalRes.rows[0] as any)?.c || 0),
      statusCounts,
      limit,
      offset,
    });
  } catch (e: any) {
    console.error('[custom-requests] list failed:', e?.message);
    // success:false so the UI can show a real error instead of a misleading "No requests".
    return NextResponse.json({ success: false, error: 'Failed to load requests', requests: [], total: 0, statusCounts: {} }, { status: 200 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await allowOwnerOrStaff(req);
  if (!auth.ok) {
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

  logStaffAction(auth.email || 'owner', 'request:update', id, status || (adminNotes !== undefined ? 'note' : ''));
  return NextResponse.json({ success: true, request: updated });
}
