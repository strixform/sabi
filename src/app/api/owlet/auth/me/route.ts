import { NextRequest, NextResponse } from 'next/server';
import { getOwletSession } from '@/lib/owletAuth';

export async function GET(req: NextRequest) {
  try {
    const session = await getOwletSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: session,
    });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}
