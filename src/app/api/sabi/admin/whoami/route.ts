import { NextRequest, NextResponse } from 'next/server';
import { getAdminRole } from '@/lib/sabiStaff';

export const preferredRegion = 'sfo1';

// Returns the caller's admin role so the dashboard can scope which tabs/actions
// to show. owner = full access; staff = Orders + Requests + proof moderation.
export async function GET(req: NextRequest) {
  const { role, email } = await getAdminRole(req);
  if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json({ role, email });
}
