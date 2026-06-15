import { NextRequest, NextResponse } from 'next/server';
import { getAdminRole } from '@/lib/sabiStaff';

export const preferredRegion = 'sfo1';
export const maxDuration = 15;

// Returns the caller's admin role so the dashboard can scope which tabs/actions
// to show. owner = full access; staff = Orders + Requests + proof moderation.
// Never throws — a failure resolves to 403 so the client never hangs.
export async function GET(req: NextRequest) {
  try {
    const { role, email } = await getAdminRole(req);
    if (!role) return NextResponse.json({ role: null }, { status: 403 });
    return NextResponse.json({ role, email });
  } catch {
    return NextResponse.json({ role: null }, { status: 403 });
  }
}
