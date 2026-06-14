import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { invalidateSabiSession } from '@/lib/sabiAuth';

export const preferredRegion = 'sfo1';

// The SABI header POSTs here on logout. Previously this route did not exist, so
// logout 404'd and the session cookies were never cleared. Clear both cookies
// (with path '/', matching how they're set) and invalidate the Redis session.
export async function POST(_req: NextRequest) {
  let token: string | undefined;
  try {
    token = (await cookies()).get('sabi_session_token')?.value;
  } catch { /* ignore */ }

  if (token) {
    await invalidateSabiSession(token).catch(() => {});
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  const expire = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  };
  response.cookies.set('sabi_session_token', '', expire);
  response.cookies.set('sabi_session_id', '', expire);
  return response;
}
