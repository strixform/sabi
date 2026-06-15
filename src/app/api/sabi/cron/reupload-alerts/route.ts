import { NextRequest, NextResponse } from 'next/server';
import { listStaff } from '@/lib/sabiStaff';
import { sendStaffReuploadAlert, sendAdminAlertEmail } from '@/lib/email';

export const preferredRegion = 'sfo1';
export const maxDuration = 30;

const G360_URL = process.env.GAMERZ360_API_URL || 'https://gamerz360.com';
// Runs every 30 min; look back a touch further so nothing slips between runs.
const WINDOW_MIN = 35;

/**
 * Emails active staff (and the owner) when taskers have RE-UPLOADED flagged
 * proofs in the last window, so they re-review without watching the console.
 * Auth: Bearer CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = process.env.SABI_INTEGRATION_TOKEN;
  if (!token) return NextResponse.json({ ok: true, skipped: 'no integration token' });

  const since = new Date(Date.now() - WINDOW_MIN * 60 * 1000).toISOString();
  let count = 0;
  try {
    const res = await fetch(`${G360_URL}/api/admin/sabi/resubmitted-proofs?since=${encodeURIComponent(since)}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const d = await res.json().catch(() => ({}));
    count = d?.count || 0;
  } catch {
    return NextResponse.json({ ok: true, skipped: 'gamerz360 unreachable' });
  }

  if (count === 0) return NextResponse.json({ ok: true, count: 0 });

  // Email every active staff member + the owner.
  const staff = await listStaff().catch(() => []);
  const recipients = staff.filter(s => s.active).map(s => s.email);
  let sent = 0;
  for (const email of recipients) {
    await sendStaffReuploadAlert(email, count).catch(() => {});
    sent++;
  }
  sendAdminAlertEmail('Re-uploads to re-review', `<p>${count} flagged proof(s) were re-uploaded in the last ${WINDOW_MIN} minutes and need re-review.</p>`).catch(() => {});

  return NextResponse.json({ ok: true, count, staffNotified: sent });
}
