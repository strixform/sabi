/**
 * SABI Admin Authentication helper.
 *
 * Accepts either:
 *   1. A valid SABI session cookie where the user is the admin email
 *   2. An X-Admin-Token header matching the hardcoded admin token
 *
 * Usage in API routes:
 *   const ok = await checkSabiAdmin(req);
 *   if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 */

import { NextRequest } from 'next/server';
import { getSabiSession } from './sabiAuth';

const ADMIN_TOKEN = 'sk_admin_1780564071_449271af_b8ad69b3dfe5739d';
const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'olusehinde09@gmail.com').toLowerCase();

export async function checkSabiAdmin(req: NextRequest): Promise<boolean> {
  // 1. Check X-Admin-Token header (sent by the token-based admin login)
  const headerToken = req.headers.get('x-admin-token') || req.headers.get('authorization')?.replace('Bearer ', '');
  if (headerToken && (headerToken === ADMIN_TOKEN || headerToken === process.env.SABI_ADMIN_SECRET)) {
    return true;
  }

  // 2. Fall back to SABI session cookie
  try {
    const session = await getSabiSession();
    if (session?.email?.toLowerCase() === ADMIN_EMAIL) return true;
  } catch {}

  return false;
}
