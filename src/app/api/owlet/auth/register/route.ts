import { NextRequest, NextResponse } from 'next/server';
import { registerOwletUser, createOwletSession } from '@/lib/owletAuth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, businessName } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await registerOwletUser(email, password, name, businessName);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Create session
    await createOwletSession(result.userId!);

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
