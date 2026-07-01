import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { sabiExecute } from '@/lib/tursoClient';
import { ensureTeamTable } from '@/lib/sabiTeam';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'sfo1';

async function inviteByToken(token: string) {
  const r = await sabiExecute({
    sql: `SELECT t.id, t.ownerId, t.memberEmail, t.status, u.name AS ownerName, u.businessName AS ownerBusiness
          FROM "SabiTeamMember" t JOIN "SabiUser" u ON u.id = t.ownerId
          WHERE t.token = ? LIMIT 1`,
    args: [token],
  }).catch(() => ({ rows: [] as any[] }));
  return r.rows[0] as any;
}

// GET ?token — preview who invited you (for the accept page).
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || '';
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });
  await ensureTeamTable();
  const inv = await inviteByToken(token);
  if (!inv) return NextResponse.json({ found: false }, { status: 404 });
  return NextResponse.json({
    found: true,
    status: inv.status,
    invitedEmail: inv.memberEmail,
    owner: inv.ownerBusiness || inv.ownerName || 'a SABI account',
  });
}

// POST { token } — invitee (signed in) accepts. Requires the session email to
// match the invited email, then links the membership and marks it active.
export async function POST(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Sign in (or create an account) with the invited email, then accept.', needAuth: true }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const token = String(body.token || '');
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });
  await ensureTeamTable();

  const inv = await inviteByToken(token);
  if (!inv) return NextResponse.json({ error: 'Invite not found.' }, { status: 404 });
  if (inv.status === 'active') return NextResponse.json({ success: true, already: true, owner: inv.ownerBusiness || inv.ownerName });
  if (inv.status !== 'invited') return NextResponse.json({ error: 'This invite is no longer valid.' }, { status: 409 });
  if (String(inv.memberEmail).toLowerCase() !== session.email.toLowerCase()) {
    return NextResponse.json({ error: `This invite was sent to ${inv.memberEmail}. Sign in with that email to accept.` }, { status: 403 });
  }

  await sabiExecute({
    sql: `UPDATE "SabiTeamMember" SET memberUserId = ?, status = 'active', acceptedAt = datetime('now') WHERE id = ?`,
    args: [session.id, inv.id],
  });
  return NextResponse.json({ success: true, owner: inv.ownerBusiness || inv.ownerName || 'the account' });
}
