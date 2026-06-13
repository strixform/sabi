import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { sabiExecute } from '@/lib/tursoClient';

export const maxDuration = 15;
export const preferredRegion = 'sfo1';

const G360_URL = process.env.GAMERZ360_API_URL || 'https://gamerz360.com';

/**
 * GET /api/sabi/orders/proofs?orderId=xxx
 * Returns the real proof (screenshots/handles) the taskers uploaded for THIS
 * buyer's order. Verifies the order belongs to the logged-in user, then pulls
 * the proofs from gamerz360 via the integration token.
 */
export async function GET(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orderId = req.nextUrl.searchParams.get('orderId')?.trim();
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  try {
    // Ownership check — the order must belong to this user.
    const own = await sabiExecute({
      sql: `SELECT id FROM SabiOrder WHERE id = ? AND userId = ? LIMIT 1`,
      args: [orderId, session.id],
    });
    if (own.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // The buyer's "before" screenshot + starting count (guarded — columns may not exist yet in prod).
    let startScreenshotUrl: string | null = null;
    let startCount: number | null = null;
    try {
      const s = await sabiExecute({ sql: `SELECT startScreenshotUrl, startCount FROM SabiOrder WHERE id = ? LIMIT 1`, args: [orderId] });
      startScreenshotUrl = (s.rows[0] as any)?.startScreenshotUrl ?? null;
      const sc = (s.rows[0] as any)?.startCount;
      startCount = (sc === null || sc === undefined) ? null : Number(sc);
    } catch { /* columns not added yet */ }

    const token = process.env.SABI_INTEGRATION_TOKEN;
    if (!token) return NextResponse.json({ error: 'Integration not configured' }, { status: 503 });

    const res = await fetch(`${G360_URL}/api/admin/sabi/order-proofs?sabiOrderId=${encodeURIComponent(orderId)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Mozilla/5.0 (compatible; SABI-Integration/1.0)',
      },
    });
    if (!res.ok) {
      return NextResponse.json({ success: true, total: 0, approved: 0, proofs: [], startScreenshotUrl, startCount });
    }
    const data = await res.json();
    return NextResponse.json({
      success: true,
      total: data.total ?? 0,
      approved: data.approved ?? 0,
      withScreenshot: data.withScreenshot ?? 0,
      proofs: data.proofs ?? [],
      startScreenshotUrl,
      startCount,
    });
  } catch (e: any) {
    console.error('[sabi/orders/proofs]', e?.message);
    return NextResponse.json({ error: 'Failed to load proofs' }, { status: 500 });
  }
}
