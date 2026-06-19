import { NextRequest, NextResponse } from 'next/server';
import { allowOwnerOrStaff, logStaffAction } from '@/lib/sabiStaff';

export const preferredRegion = 'sfo1';
export const maxDuration = 20;

const G360_URL = process.env.GAMERZ360_API_URL || 'https://gamerz360.com';

/**
 * Staff flag (or clear) a specific tasker's proof. Forwards to gamerz360, which
 * records the flag and notifies the exact tasker. Does NOT change order status.
 * POST { completionId, action?: 'flag'|'clear', reason? }
 */
export async function POST(req: NextRequest) {
  const auth = await allowOwnerOrStaff(req);
  if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const completionId = String(body.completionId || '');
  const action = body.action === 'clear' ? 'clear' : 'flag';
  const reason = String(body.reason || '').slice(0, 300);
  if (!completionId) return NextResponse.json({ error: 'completionId required' }, { status: 400 });

  const token = process.env.SABI_INTEGRATION_TOKEN;
  if (!token) return NextResponse.json({ error: 'Integration not configured' }, { status: 503 });

  try {
    const res = await fetch(`${G360_URL}/api/admin/sabi/flag-proof`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, completionId, reason, flaggedBy: auth.email || 'staff' }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok || d?.error) return NextResponse.json({ error: d?.error || 'Flag failed' }, { status: 400 });
    logStaffAction(auth.email || 'owner', action === 'clear' ? 'proof:clear' : 'proof:flag', completionId, reason);
    return NextResponse.json({
      success: true,
      suspended: d?.suspended || false,
      finalWarning: d?.finalWarning || false,
      sameTaskCount: d?.sameTaskCount,
      weeklyCount: d?.weeklyCount,
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Could not reach gamerz360' }, { status: 502 });
  }
}
