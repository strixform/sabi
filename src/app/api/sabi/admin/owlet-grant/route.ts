import { NextRequest, NextResponse } from 'next/server';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
import { diagnoseOwletEmail, grantOwletBonus, sweepRetroactiveGrants, OWLET_BONUS_KOBO } from '@/lib/sabiOwletPromo';

export const preferredRegion = 'sfo1';
export const maxDuration = 120;

/**
 * Owlet ₦2,000 support tool.
 *   GET  ?email=  → diagnose why an email did/didn't get the bonus.
 *   POST { email }            → retroactively grant to that one user (if eligible).
 *   POST { sweep:true, cursor?, limit? } → grant to ALL verified allowlisted users who missed it.
 */
export async function GET(req: NextRequest) {
  if (!(await checkSabiAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const email = new URL(req.url).searchParams.get('email') || '';
  if (!email) return NextResponse.json({ error: 'Pass ?email=' }, { status: 400 });
  return NextResponse.json({ success: true, ...(await diagnoseOwletEmail(email)) });
}

export async function POST(req: NextRequest) {
  if (!(await checkSabiAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const b = await req.json().catch(() => ({} as any));

  if (b?.sweep) {
    const r = await sweepRetroactiveGrants(Number(b.limit) || 300, b.cursor ? String(b.cursor) : undefined);
    return NextResponse.json({ success: true, mode: 'sweep', ...r });
  }

  const email = String(b?.email || '').trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'Send { email } or { sweep:true }' }, { status: 400 });
  const diag = await diagnoseOwletEmail(email);
  if (!diag.eligibleToGrant) {
    return NextResponse.json({ success: false, granted: 0, note: diag.reason, diag });
  }
  const g = await grantOwletBonus(diag.userId!, email);
  return NextResponse.json({ success: g.granted > 0, granted: g.granted, amountNaira: OWLET_BONUS_KOBO / 100, note: g.granted > 0 ? 'Granted ₦2,000.' : 'Could not grant (raced or cap hit).', diag });
}
