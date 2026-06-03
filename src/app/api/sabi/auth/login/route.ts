import { NextRequest, NextResponse } from 'next/server';
import { loginSabiUser, createSabiSession } from '@/lib/sabiAuth';

export async function POST(req: NextRequest) {
  try {
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

    await createSabiSession(result.userId!);

    return NextResponse.json({
      success: true,
      userId: result.userId,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
