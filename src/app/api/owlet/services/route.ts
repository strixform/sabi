import { NextRequest, NextResponse } from 'next/server';
import { getAllServices } from '@/lib/owletServices';

export const maxDuration = 15;
export const preferredRegion = 'sfo1'; // Turso DB in Oregon (sfo1) — keeps latency minimal

export async function GET(req: NextRequest) {
  try {
    const services = getAllServices();

    return NextResponse.json({
      success: true,
      services,
      count: services.length,
    });
  } catch (error) {
    console.error('Get services error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}