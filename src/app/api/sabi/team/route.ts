import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { sabiExecute } from '@/lib/tursoClient';
import { ensureTeamTable, newInviteToken, VALID_ROLES } from '@/lib/sabiTeam';
import { sendTeamInviteEmail } from '@/lib/email';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'sfo1';
export const maxDuration = 20;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sability.io';

// GET — owner lists the people they've invited to view their account.
export async function GET() {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensureTeamTable();
  const r = await sabiExecute({
    sql: `SELECT id, memberEmail, role, status, invitedAt, acceptedAt FROM "SabiTeamMember"
          WHERE ownerId = ? AND status != 'removed' ORDER BY invitedAt DESC`,
    args: [session.id],
  });
  return NextResponse.json({ members: r.rows });
}

// POST { email } — owner invites a viewer.
export async function POST(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (email === session.email.toLowerCase()) {
    return NextResponse.json({ error: "That's your own account." }, { status: 400 });
  }
  const role: string = VALID_ROLES.includes(body.role) ? body.role : 'viewer';
  await ensureTeamTable();

  // Already invited / active for this owner+email? Don't duplicate.
  const existing = await sabiExecute({
    sql: `SELECT id, status FROM "SabiTeamMember" WHERE ownerId = ? AND memberEmail = ? AND status != 'removed' LIMIT 1`,
    args: [session.id, email],
  });
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: `Already ${(existing.rows[0] as any).status} for ${email}.` }, { status: 409 });
  }

  const token = newInviteToken();
  await sabiExecute({
    sql: `INSERT INTO "SabiTeamMember" (id, ownerId, memberEmail, memberUserId, role, status, token, invitedAt)
          VALUES (?, ?, ?, NULL, ?, 'invited', ?, datetime('now'))`,
    args: [crypto.randomUUID(), session.id, email, role, token],
  });

  const inviterName = session.businessName || session.name || 'A SABI user';
  await sendTeamInviteEmail(email, inviterName, `${APP_URL}/sabi/team/accept?token=${token}`, role).catch(() => {});

  return NextResponse.json({ success: true, message: `Invite sent to ${email} as ${role}.` });
}

// DELETE ?id= — owner removes a member/invite.
export async function DELETE(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await ensureTeamTable();
  await sabiExecute({
    sql: `UPDATE "SabiTeamMember" SET status = 'removed' WHERE id = ? AND ownerId = ?`,
    args: [id, session.id],
  });
  return NextResponse.json({ success: true });
}
