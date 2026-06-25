import { NextRequest, NextResponse } from 'next/server';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';

export const maxDuration = 20;
export const preferredRegion = 'sfo1';

const G360_URL = process.env.GAMERZ360_API_URL || 'https://gamerz360.com';

/**
 * Command-area tasker traceability (admin only). Proxies to gamerz360's owner-only
 * order-taskers endpoint with the integration token, so the owner can see WHICH
 * real person did each order, or search a person's whole job history.
 *
 * GET ?sabiOrderId=X | ?tasker=email|username
 */
export async function GET(req: NextRequest) {
  if (!await checkSabiAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const token = process.env.SABI_INTEGRATION_TOKEN;
  if (!token) return NextResponse.json({ error: 'Integration not configured' }, { status: 503 });

  const sabiOrderId = req.nextUrl.searchParams.get('sabiOrderId')?.trim();
  const tasker = req.nextUrl.searchParams.get('tasker')?.trim();
  if (!sabiOrderId && !tasker) {
    return NextResponse.json({ error: 'Provide an order ID or a tasker email/username' }, { status: 400 });
  }

  const qs = sabiOrderId ? `sabiOrderId=${encodeURIComponent(sabiOrderId)}` : `tasker=${encodeURIComponent(tasker!)}`;
  try {
    const res = await fetch(`${G360_URL}/api/admin/sabi/order-taskers?${qs}`, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'Mozilla/5.0 (compatible; SABI-Integration/1.0)' },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data?.error || 'Lookup failed' }, { status: res.status });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: 'Lookup failed', detail: e?.message?.slice(0, 200) }, { status: 500 });
  }
}
