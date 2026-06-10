import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { createSabiSession, prewarmSessionCache } from '@/lib/sabiAuth';
import { sabiExecute } from '@/lib/tursoClient';
import crypto from 'crypto';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://sability.io';

// 25s max — Google token exchange (external) + up to 3 DB ops (findUnique/create/session)
// each with 6s withDbTimeout + Redis prewarm. Under Turso load this easily hits 15s.
// Still well under Cloudflare's 100s limit.
export const maxDuration = 25;
export const preferredRegion = 'sfo1';

// Wraps any promise in an 8s timeout — if DB is slow/rate-limited,
// fail fast with a clear error instead of hanging until Cloudflare kills us.
async function withDbTimeout<T>(p: Promise<T>): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('db_timeout')), 8000)
    ),
  ]);
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    // Migrations applied - database ready

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://sability.io'}/sabi/login?error=google_no_code`
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "685195293928-3aqb2gaq85a92ctc145rgnddk2j7jdr6.apps.googleusercontent.com",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sability.io'}/api/sabi/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[Google OAuth] Token exchange failed:', errorText);
      console.error('[Google OAuth] Status:', tokenResponse.status);
      console.error('[Google OAuth] Client Secret set:', !!process.env.GOOGLE_CLIENT_SECRET);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://sability.io'}/sabi/login?error=google_token_failed`
      );
    }

    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;

    // Get user info
    const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoResponse.ok) {
      console.error('[Google OAuth] User info fetch failed:', await userInfoResponse.text());
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://sability.io'}/sabi/login?error=google_profile_failed`
      );
    }

    const googleUser = await userInfoResponse.json();
    const { email, name, sub: googleId } = googleUser;

    if (!email) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://sability.io'}/sabi/login?error=google_no_email`
      );
    }

    // Find user via DIRECT libsql (sabiExecute) — NOT Prisma.
    // Prisma's libsql adapter has 10-80s cold starts on Vercel; the 8s withDbTimeout
    // fired before Prisma even connected → 'db_timeout' → ?error=google_exception&detail=busy.
    // sabiExecute connects over raw HTTP (no adapter cold start) + has 429 retry backoff.
    let user: any = null;
    let readFailed = false;
    try {
      const res = await sabiExecute({
        sql: `SELECT id, email, name, status, emailVerified, businessName
              FROM SabiUser WHERE email = ? LIMIT 1`,
        args: [email],
      }, 6000);
      user = res.rows[0] ?? null;
    } catch {
      readFailed = true;
    }

    // Read genuinely failed (Turso unreachable after retries) — bounce with retry msg.
    // Do NOT fall through to create: that would hit a unique-email constraint.
    if (readFailed) {
      return NextResponse.redirect(`${BASE}/sabi/login?error=google_exception&detail=busy`);
    }

    if (!user) {
      // Genuinely new user — create. This path is rare (most logins are existing users).
      const randomPw = await hash(crypto.randomBytes(32).toString('hex'), 10);
      try {
        user = await withDbTimeout(
          prisma.sabiUser.create({
            data: {
              email,
              name: name || email.split('@')[0],
              emailVerified: true,
              passwordHash: randomPw,
              wallet: { create: {} },
            },
            select: { id: true, email: true, name: true, status: true, emailVerified: true, businessName: true },
          })
        );
      } catch {
        return NextResponse.redirect(`${BASE}/sabi/login?error=google_exception&detail=busy`);
      }
    } else {
      // Existing user — mark verified via direct libsql (best-effort, never blocks)
      sabiExecute({
        sql: `UPDATE SabiUser SET emailVerified = 1 WHERE id = ?`,
        args: [user.id],
      }).catch(() => {});
    }

    // Create session — sets cookies + Redis immediately, Turso write is best-effort
    // inside createSabiSession (never throws), so this resolves fast even if Turso is slow.
    const token = await createSabiSession(user.id);

    // CRITICAL: await prewarm — ensures Redis has the session BEFORE the redirect fires.
    // Without await, browser loads /sabi/dashboard before cache is set → Turso fallback
    // → if Turso is slow → getSabiSession returns null → back to login (loop).
    await prewarmSessionCache(token, {
      id: user.id, email: user.email, name: user.name,
      businessName: user.businessName ?? null,
      status: user.status, emailVerified: true,
    });

    // Redirect to dashboard
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://sability.io'}/sabi/dashboard`
    );

    // Set cookies on the redirect response
    response.cookies.set('sabi_session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    response.cookies.set('sabi_session_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error('[Google OAuth] Callback error:', msg.slice(0, 200));

    // DB timeout or Turso 429 — redirect fast with a retry message
    // (never hang here; that causes 524 from Cloudflare)
    if (msg.includes('db_timeout') || msg.includes('429') || msg.toLowerCase().includes('rate')) {
      return NextResponse.redirect(`${BASE}/sabi/login?error=google_exception&detail=busy`);
    }

    return NextResponse.redirect(`${BASE}/sabi/login?error=google_exception`);
  }
}
