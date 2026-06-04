import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordReset } from '@/lib/sabiAuth';

export async function POST(req: NextRequest) {
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

    // In production, send email with reset link
    // Email content would include: ${process.env.NEXT_PUBLIC_APP_URL}/sabi/reset-password?token=${result.resetToken}

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
