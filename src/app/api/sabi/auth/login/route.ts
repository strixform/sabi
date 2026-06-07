import { NextRequest, NextResponse } from 'next/server';
import { loginSabiUser, createSabiSession } from '@/lib/sabiAuth';
import { getRateLimitKey, checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const preferredRegion = 'sfo1';
export const maxDuration = 15;

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

    const result = await loginSabiUser(email, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    const token = await createSabiSession(result.userId!);

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
