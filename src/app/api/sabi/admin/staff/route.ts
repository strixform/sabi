import { NextRequest, NextResponse } from 'next/server';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
import { getAdminRole, listStaff, addStaff, removeStaff, listAudit } from '@/lib/sabiStaff';

export const preferredRegion = 'sfo1';
export const maxDuration = 15;

// GET — list staff + recent audit. Owner only.
export async function GET(req: NextRequest) {
  if (!(await checkSabiAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const [staff, audit] = await Promise.all([listStaff(), listAudit(100)]);
  return NextResponse.json({ staff, audit });
}

// POST { email } — add a staff member (must be an existing SABI account email). Owner only.
export async function POST(req: NextRequest) {
  if (!(await checkSabiAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { email } = await req.json().catch(() => ({}));
  const e = String(email || '').trim().toLowerCase();
  if (!e || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
    return NextResponse.json({ error: 'Enter a valid email' }, { status: 400 });
  }
  const { email: actor } = await getAdminRole(req);
  await addStaff(e, actor || 'owner');
  return NextResponse.json({ success: true });
}

// DELETE ?email= — deactivate a staff member. Owner only.
export async function DELETE(req: NextRequest) {
  if (!(await checkSabiAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const email = req.nextUrl.searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });
  await removeStaff(email);
  return NextResponse.json({ success: true });
}
