import { NextRequest, NextResponse } from 'next/server';
import { loginSabiUser, createSabiSession, prewarmSessionCache } from '@/lib/sabiAuth';
import { getRateLimitKey, checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const preferredRegion = 'sfo1';
export const maxDuration = 30; // Turso wake-up can take 15-20s on first cold request

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 5 attempts per minute per IP
    const rateLimitKey = getRateLimitKey(req, 'login');
    const rateLimit = await checkRateLimit(rateLimitKey, 5, 60000);

    if (!rateLimit.allowed) {
      return rateLimitResponse(5, rateLimit.resetTime);
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Race against 25s — allows Turso to wake from suspension (can take 15-20s cold)
    // Falls back with a clean error rather than hanging
    const result = await Promise.race([
      loginSabiUser(email, password),
      new Promise<{ success: false; error: string }>((resolve) =>
        setTimeout(() => resolve({ success: false, error: 'Service temporarily unavailable — please try again in a moment' }), 25000)
      ),
    ]);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    const token = await Promise.race([
      createSabiSession(result.userId!),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('session_timeout')), 25000)
      ),
    ]);

    // Pre-warm Redis so the next page load reads from Redis, not (cold) Turso.
    // MUST await before returning — if we fire-and-forget, the browser redirects
    // to /sabi/dashboard before Redis has the session, getSabiSession() misses
    // Redis, falls back to Turso (slow/not-written-yet) → null → login loop.
    //
    // We prewarm from the profile loginSabiUser ALREADY fetched — no extra DB
    // lookup. The old code did a second prisma.findUnique here that timed out on
    // a cold Turso, so Redis often wasn't warmed → the "refresh & login again" bug.
    if (result.user) {
      try {
        await prewarmSessionCache(token, result.user);
      } catch { /* non-fatal — login still succeeds, session validated via Turso fallback */ }
    }

    const response = NextResponse.json({
      success: true,
      userId: result.userId,
      message: 'Login successful',
    });

    // Ensure cookies are set on the response. path '/' is REQUIRED so the cookie
    // is sent to /sabi/dashboard and all /api routes — not just /api/sabi/auth.
    response.cookies.set('sabi_session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    response.cookies.set('sabi_session_id', result.userId!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
