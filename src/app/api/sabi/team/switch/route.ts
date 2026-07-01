import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { sabiExecute } from '@/lib/tursoClient';
import { ensureTeamTable, ACTING_COOKIE, canSpend } from '@/lib/sabiTeam';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'sfo1';

// POST { ownerId } — switch into a workspace you can operate in (member/admin).
// POST { ownerId: null } — switch back to your own account.
export async function POST(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const ownerId = body.ownerId ? String(body.ownerId) : null;

  // Switch back to own account.
  if (!ownerId || ownerId === session.id) {
    const res = NextResponse.json({ success: true, acting: null });
    res.cookies.delete(ACTING_COOKIE);
    return res;
  }

  await ensureTeamTable();
  const r = await sabiExecute({
    sql: `SELECT t.role, u.businessName AS biz, u.name AS nm FROM "SabiTeamMember" t JOIN "SabiUser" u ON u.id = t.ownerId
          WHERE t.memberUserId = ? AND t.ownerId = ? AND t.status = 'active' LIMIT 1`,
    args: [session.id, ownerId],
  });
  const row = r.rows[0] as any;
  if (!row) return NextResponse.json({ error: 'You are not a member of that account.' }, { status: 403 });
  if (!canSpend(row.role)) {
    return NextResponse.json({ error: 'Your role on this account is view-only — use the read view instead.' }, { status: 403 });
  }

  const res = NextResponse.json({ success: true, acting: { ownerId, role: row.role, name: row.biz || row.nm } });
  // httpOnly so it can't be tampered client-side; the resolver re-verifies anyway.
  res.cookies.set(ACTING_COOKIE, ownerId, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12 });
  return res;
}
