import { NextRequest, NextResponse } from 'next/server';
import { registerSabiUser, createSabiSession } from '@/lib/sabiAuth';
import { getRateLimitKey, checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 3 registration attempts per 10 minutes per IP
    const rateLimitKey = getRateLimitKey(req, 'register');
    const rateLimit = checkRateLimit(rateLimitKey, 3, 600000);

    if (!rateLimit.allowed) {
      return rateLimitResponse(3, rateLimit.resetTime);
    }

    const body = await req.json();
    const { email, password, name, businessName } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await registerSabiUser(email, password, name, businessName);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    await createSabiSession(result.userId!);

    return NextResponse.json({
      success: true,
      userId: result.userId,
      message: 'Registration successful. Please verify your email.',
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
