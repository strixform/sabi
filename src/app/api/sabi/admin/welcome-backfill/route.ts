import { NextRequest, NextResponse } from 'next/server';
import { sabiExecute } from '@/lib/tursoClient';
import { grantWelcomeBonus, WELCOME_BONUS_KOBO } from '@/lib/sabiWelcomeBonus';
import { sendWelcomeBonusEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Owner tool: grant the ₦500 welcome taste to existing email-verified users who
// have NEVER ordered, and email them "you have ₦500, come try it". Idempotent
// (grant + credit both keyed on the reference), bounded per run, re-runnable —
// call again until `remaining` hits 0. `&email=0` grants silently (no mail).
const TOKEN = 'w3lc0m3b4ckf1ll7a2e9c';

const ELIGIBLE = `SabiUser u
  WHERE u.emailVerified = 1
    AND NOT EXISTS (SELECT 1 FROM SabiOrder o WHERE o.userId = u.id)
    AND NOT EXISTS (SELECT 1 FROM SabiTransaction t WHERE t.userId = u.id AND t.reference = 'welcome_bonus_' || u.id)`;

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('token') !== TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get('limit') || '40')));
  const emailOn = req.nextUrl.searchParams.get('email') !== '0';

  const rows = (await sabiExecute({
    sql: `SELECT u.id id, u.email email, u.name name FROM ${ELIGIBLE} LIMIT ?`,
    args: [limit],
  })).rows as { id: string; email: string; name: string | null }[];

  let granted = 0, mailed = 0;
  for (const r of rows) {
    const g = await grantWelcomeBonus(r.id);
    if (g.granted > 0) {
      granted++;
      if (emailOn && r.email) {
        try { await sendWelcomeBonusEmail(r.email, r.name || '', Math.round(WELCOME_BONUS_KOBO / 100)); mailed++; } catch { /* skip a bad address */ }
        await new Promise((res) => setTimeout(res, 130)); // throttle — a burst of parallel sends is how Resend 429s
      }
    }
  }

  const rem = await sabiExecute({ sql: `SELECT COUNT(*) n FROM ${ELIGIBLE}` }).catch(() => ({ rows: [{ n: -1 }] }));
  return NextResponse.json({
    ok: true, batch: rows.length, granted, mailed,
    remaining: Number((rem.rows[0] as { n?: number })?.n ?? -1),
  });
}
