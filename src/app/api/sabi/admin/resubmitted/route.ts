import { NextRequest, NextResponse } from 'next/server';
import { allowOwnerOrStaff } from '@/lib/sabiStaff';

export const preferredRegion = 'sfo1';
export const maxDuration = 15;

const G360_URL = process.env.GAMERZ360_API_URL || 'https://gamerz360.com';

// Owner/staff: proofs a tasker re-uploaded that await re-review (for the alert).
export async function GET(req: NextRequest) {
  if (!(await allowOwnerOrStaff(req)).ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const token = process.env.SABI_INTEGRATION_TOKEN;
  if (!token) return NextResponse.json({ count: 0, items: [] });
  try {
    const res = await fetch(`${G360_URL}/api/admin/sabi/resubmitted-proofs`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const d = await res.json().catch(() => ({}));
    return NextResponse.json({ count: d?.count || 0, items: d?.items || [] });
  } catch {
    return NextResponse.json({ count: 0, items: [] });
  }
}
