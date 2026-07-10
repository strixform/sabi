import { NextRequest, NextResponse } from 'next/server';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
import { importOwletEmails, owletStats } from '@/lib/sabiOwletPromo';

export const preferredRegion = 'sfo1';
export const maxDuration = 60;

/**
 * Owlet promo allowlist.
 *   GET  → { total, claimed, enabled }
 *   POST { emails: string[] } → bulk-add to the allowlist (send in chunks of ~5–10k).
 */
export async function GET(req: NextRequest) {
  if (!(await checkSabiAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json({ success: true, ...(await owletStats()) });
}

export async function POST(req: NextRequest) {
  if (!(await checkSabiAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const emails = Array.isArray(body?.emails) ? body.emails : [];
  if (emails.length === 0) return NextResponse.json({ error: 'Send { emails: [...] }' }, { status: 400 });
  if (emails.length > 20000) return NextResponse.json({ error: 'Max 20,000 per request — send in chunks.' }, { status: 400 });
  const r = await importOwletEmails(emails);
  return NextResponse.json({ success: true, ...r, ...(await owletStats()) });
}
