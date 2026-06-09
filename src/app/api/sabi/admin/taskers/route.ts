import { NextRequest, NextResponse } from 'next/server';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
export const maxDuration = 15;
export const preferredRegion = 'sfo1'; // Turso DB in Oregon (sfo1) — keeps latency minimal


interface Tasker {
  id: string;
  name: string;
  username: string;
  currentLoad: number;
  maxCapacity: number;
  specializations: string[];
  pointsPerTask: number;
}

export async function GET(req: NextRequest) {
  try {
    if (!await checkSabiAdmin(req)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch taskers from gamerz360 admin API
    const gamerz360AdminApiUrl = process.env.GAMERZ360_ADMIN_API_URL || 'https://ads.gamerz360.com/api';
    const gamerz360AdminToken = process.env.GAMERZ360_ADMIN_TOKEN;

    const taskerRes = await fetch(`${gamerz360AdminApiUrl}/taskers?status=active`, {
      headers: {
        'Authorization': `Bearer ${gamerz360AdminToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!taskerRes.ok) {
      // Return mock taskers for development
      const mockTaskers: Tasker[] = [
        {
          id: 'tasker_1',
          name: 'Ahmed Hassan',
          username: 'ahmedh',
          currentLoad: 2,
          maxCapacity: 10,
          specializations: ['instagram_followers', 'instagram_likes', 'instagram_engagement'],
          pointsPerTask: 50,
        },
        {
          id: 'tasker_2',
          name: 'Zainab Okafor',
          username: 'zainabo',
          currentLoad: 5,
          maxCapacity: 10,
          specializations: ['twitter_followers', 'twitter_likes', 'twitter_retweets'],
          pointsPerTask: 45,
        },
        {
          id: 'tasker_3',
          name: 'Chisom Nwosu',
          username: 'chisomn',
          currentLoad: 1,
          maxCapacity: 8,
          specializations: ['youtube_subscribers', 'youtube_views', 'youtube_likes'],
          pointsPerTask: 55,
        },
        {
          id: 'tasker_4',
          name: 'Bola Adeyemi',
          username: 'bolaa',
          currentLoad: 3,
          maxCapacity: 12,
          specializations: ['tiktok_followers', 'tiktok_likes', 'tiktok_views'],
          pointsPerTask: 40,
        },
        {
          id: 'tasker_5',
          name: 'Nneka Eze',
          username: 'nnekae',
          currentLoad: 0,
          maxCapacity: 10,
          specializations: ['instagram_followers', 'youtube_subscribers', 'tiktok_followers'],
          pointsPerTask: 50,
        },
      ];

      return NextResponse.json({
        success: true,
        taskers: mockTaskers,
        source: 'mock',
      });
    }

    const data = await taskerRes.json();

    return NextResponse.json({
      success: true,
      taskers: data.taskers || [],
      source: 'gamerz360',
    });
  } catch (error) {
    console.error('Get taskers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch taskers' },
      { status: 500 }
    );
  }
}
