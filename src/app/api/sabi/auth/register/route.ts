import { NextRequest, NextResponse } from 'next/server';
import { registerSabiUser, createSabiSession } from '@/lib/sabiAuth';
import { getRateLimitKey, checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { sendVerificationEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
export const maxDuration = 15;


export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 3 registration attempts per 10 minutes per IP
    const rateLimitKey = getRateLimitKey(req, 'register');
    const rateLimit = await checkRateLimit(rateLimitKey, 3, 600000);

    if (!rateLimit.allowed) {
      return rateLimitResponse(3, rateLimit.resetTime);
    }

    const body = await req.json();
    const { email, password, name, businessName, referralCode } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await registerSabiUser(email, password, name, businessName, referralCode);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Send verification email
    const user = await prisma.sabiUser.findUnique({ where: { id: result.userId! } });
    if (user && user.verifyCode) {
      await sendVerificationEmail(email, user.verifyCode, name);
    }

    const token = await createSabiSession(result.userId!);

    const response = NextResponse.json({
      success: true,
      userId: result.userId,
      message: 'Registration successful. Check your email to verify.',
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
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
