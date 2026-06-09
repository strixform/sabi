import { NextRequest, NextResponse } from 'next/server';
import { getOwletSession } from '@/lib/owletAuth';

export const maxDuration = 15;
export const preferredRegion = 'sfo1'; // Turso DB in Oregon (sfo1) — keeps latency minimal

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