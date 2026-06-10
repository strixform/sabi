import { NextRequest, NextResponse } from 'next/server';
import { loginSabiUser, createSabiSession, prewarmSessionCache } from '@/lib/sabiAuth';
import { getRateLimitKey, checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { prisma } from '@/lib/prisma';

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

    // Pre-warm Redis — next page load reads from Redis, not Turso
    // userId is enough to build a minimal session; getSabiSession will enrich on next miss
    // MUST await prewarm before returning — if we fire-and-forget, the browser
    // redirects to /sabi/dashboard before Redis has the session. getSabiSession()
    // misses Redis, falls back to Turso (slow/not-written-yet) → null → login loop.
    if (result.userId) {
      try {
        const u = await Promise.race([
          prisma.sabiUser.findUnique({
            where: { id: result.userId },
            select: { id: true, email: true, name: true, businessName: true, status: true, emailVerified: true },
          }),
          new Promise<null>(resolve => setTimeout(() => resolve(null), 4000)),
        ]);
        if (u) {
          await prewarmSessionCache(token, {
            id: u.id, email: u.email, name: u.name,
            businessName: u.businessName ?? null,
            status: u.status, emailVerified: u.emailVerified,
          });
        }
      } catch { /* non-fatal — login still succeeds, session validated via Turso fallback */ }
    }

    const response = NextResponse.json({
      success: true,
      userId: result.userId,
      message: 'Login successful',
    });

    // Ensure cookies are set on the response
    response.cookies.set('sabi_session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    response.cookies.set('sabi_session_id', result.userId!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
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
