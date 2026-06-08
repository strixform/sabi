import { NextRequest, NextResponse } from 'next/server';
export const maxDuration = 15;


export async function GET(request: NextRequest) {
  try {
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    return NextResponse.json({
      adminEmail,
      message: `Expected admin email: ${adminEmail}`,
      note: 'Check what email you are logged in with in SABI and compare it to this value',
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
