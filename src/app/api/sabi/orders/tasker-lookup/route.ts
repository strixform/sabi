import { NextRequest, NextResponse } from 'next/server';
import { allowOwnerOrStaff } from '@/lib/sabiStaff';

export const maxDuration = 20;
export const preferredRegion = 'sfo1';

const G360_URL = process.env.GAMERZ360_API_URL || 'https://gamerz360.com';

/**
 * Staff/owner tasker lookup — every task a tasker has submitted. Proxies to gamerz360
 * with the integration token. GET ?q=<email|username>
 */
export async function GET(req: NextRequest) {
  const auth = await allowOwnerOrStaff(req);
  if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q) return NextResponse.json({ error: 'q required' }, { status: 400 });

  const token = process.env.SABI_INTEGRATION_TOKEN;
  if (!token) return NextResponse.json({ error: 'Integration not configured' }, { status: 503 });

  try {
    const res = await fetch(`${G360_URL}/api/admin/sabi/tasker-lookup?q=${encodeURIComponent(q)}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'SABI-Integration/1.0' },
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: d?.error || 'Lookup failed', candidates: d?.candidates }, { status: res.status });
    return NextResponse.json(d);
  } catch {
    return NextResponse.json({ error: 'Could not reach gamerz360' }, { status: 502 });
  }
}
