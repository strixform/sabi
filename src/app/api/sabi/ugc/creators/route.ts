import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';

export const maxDuration = 20;
export const preferredRegion = 'sfo1';

const G360_URL = process.env.GAMERZ360_API_URL || 'https://gamerz360.com';

/**
 * Browse approved UGC creators for the marketplace gallery. Any signed-in SABI
 * user can browse. Proxies to gamerz360 (token) which returns only the creators'
 * public social profiles + stats — no gamers360 identity is ever exposed.
 *
 * GET ?platform=&niche=&minFollowers=
 */
export async function GET(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const token = process.env.SABI_INTEGRATION_TOKEN;
  if (!token) return NextResponse.json({ success: true, creators: [], count: 0 });

  const sp = req.nextUrl.searchParams;
  const qs = new URLSearchParams();
  if (sp.get('platform')) qs.set('platform', sp.get('platform')!);
  if (sp.get('niche')) qs.set('niche', sp.get('niche')!);
  if (sp.get('minFollowers')) qs.set('minFollowers', sp.get('minFollowers')!);

  try {
    const res = await fetch(`${G360_URL}/api/admin/sabi/ugc-creators?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'Mozilla/5.0 (compatible; SABI-Integration/1.0)' },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ success: true, creators: [], count: 0 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: true, creators: [], count: 0 });
  }
}
