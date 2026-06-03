import { NextRequest, NextResponse } from 'next/server';
import { registerSabiUser, createSabiSession } from '@/lib/sabiAuth';

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
