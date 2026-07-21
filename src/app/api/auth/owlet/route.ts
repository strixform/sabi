import { NextRequest, NextResponse } from 'next/server';
import { verifyHandoffToken, resolveOwletUser, bridgeConfigured } from '@/lib/owletBridge';
import { createSabiSession } from '@/lib/sabiAuth';

export const maxDuration = 15;
export const preferredRegion = 'sfo1'; // Turso DB in Oregon — keeps latency minimal
export const dynamic = 'force-dynamic';

/**
 * Receives an Owlet single sign-on assertion and opens a SABI session.
 *
 * POST only, and the token arrives in the body: a token in a query string
 * would be written to browser history, access logs and the Referer header.
 */
export async function POST(req: NextRequest) {
  if (!bridgeConfigured()) {
    return fail('SABI sign-on is not configured yet.', 503);
  }

  // Accept a form post (the hand-off page) or JSON (tests/tools).
  let token = '';
  const contentType = req.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    token = String(((await req.json().catch(() => ({}))) as { token?: string }).token ?? '');
  } else {
    token = String((await req.formData().catch(() => new FormData())).get('token') ?? '');
  }
  if (!token) return fail('Missing sign-on token.', 400);

  const verified = verifyHandoffToken(token);
  if (!verified.ok) {
    // Don't tell an attacker which check failed.
    const status = verified.reason === 'expired' ? 401 : 400;
    const msg =
      verified.reason === 'expired'
        ? 'That sign-in link expired. Head back to Owlet and press Enter SABI again.'
        : 'That sign-in link is not valid.';
    return fail(msg, status);
  }

  const resolved = await resolveOwletUser(verified.claims);
  if (!resolved.ok) {
    return fail(
      'A SABI account already uses this email address. Verify your email on Owlet first, ' +
        'then press Enter SABI again — that proves the address is yours before we connect the two.',
      403,
    );
  }

  await createSabiSession(resolved.userId);

  const dest = new URL('/sabi/dashboard', req.nextUrl.origin);
  if (resolved.created) dest.searchParams.set('welcome', 'owlet');

  const res = NextResponse.redirect(dest, 303);
  res.headers.set('cache-control', 'no-store');
  return res;
}

// A human lands here only if something went wrong, so answer in plain language.
function fail(message: string, status: number) {
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>SABI sign-in</title>
<meta name="robots" content="noindex">
<style>
 body{margin:0;min-height:100vh;display:grid;place-items:center;background:#070b16;color:#eaf0fb;
      font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:24px}
 .w{max-width:460px;text-align:center}
 b{display:block;font-size:19px;margin-bottom:10px}
 p{font-size:14.5px;line-height:1.65;color:rgba(234,240,251,.66)}
 a{display:inline-block;margin-top:18px;padding:12px 22px;border-radius:12px;background:#fbbf24;
   color:#1b1410;font-weight:800;text-decoration:none}
</style></head>
<body><div class="w"><b>We couldn't sign you in</b><p>${message}</p>
<a href="/sabi/login">Sign in to SABI</a></div></body></html>`;
  return new NextResponse(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

// A GET here means someone pasted the endpoint; explain rather than 405.
export async function GET() {
  return fail('Open SABI from your Owlet dashboard using the Enter SABI button.', 405);
}
