import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordReset } from '@/lib/sabiAuth';
import { sendPasswordResetEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { getRateLimitKey, checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  // 3 attempts per 15 minutes per IP — prevents email flooding
  const rl = await checkRateLimit(getRateLimitKey(req, 'forgot-password'), 3, 15 * 60000);
  if (!rl.allowed) return rateLimitResponse(3, rl.resetTime);

  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const result = await requestPasswordReset(email);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Send password reset email
    const user = await prisma.sabiUser.findUnique({ where: { email } });
    if (user && result.resetToken) {
      await sendPasswordResetEmail(email, result.resetToken, user.name);
    }

    return NextResponse.json({
      success: true,
      message: 'Check your email for reset instructions',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Request failed' },
      { status: 500 }
    );
  }
}
