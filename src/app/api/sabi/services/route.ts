import { NextRequest, NextResponse } from 'next/server';
import { getAllServices } from '@/lib/sabiServices';

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
