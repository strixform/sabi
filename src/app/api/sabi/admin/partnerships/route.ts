import { NextRequest, NextResponse } from 'next/server';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
import { allowOwnerOrStaff } from '@/lib/sabiStaff';
import { listPartnerships, setPartnershipStatus } from '@/lib/sabiPartnership';

export const maxDuration = 15;
export const preferredRegion = 'sfo1';

export async function GET(req: NextRequest) {
  // Owner OR staff may VIEW the partnership/reseller request list (read-only in the
  // staff console). Status changes (POST) remain owner-only below.
  if (!(await allowOwnerOrStaff(req)).ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const status = req.nextUrl.searchParams.get('status') || undefined;
  try {
    return NextResponse.json({ success: true, partnerships: await listPartnerships(status) });
  } catch {
    return NextResponse.json({ success: true, partnerships: [] });
  }
}

export async function POST(req: NextRequest) {
  if (!await checkSabiAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || '');
  const status = ['building', 'live', 'cancelled'].includes(body.status) ? body.status : null;
  if (!id || !status) return NextResponse.json({ error: 'id and valid status required' }, { status: 400 });
  await setPartnershipStatus(id, status);
  return NextResponse.json({ success: true });
}
