import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { sabiExecute } from '@/lib/tursoClient';
import { signOrderToken } from '@/lib/shareToken';

export const maxDuration = 15;
export const preferredRegion = 'sfo1';

/**
 * GET /api/sabi/orders/share-token?orderId=x
 * Returns a public, HMAC-signed share token + URL for one of the buyer's orders,
 * so they can share a read-only "Verified by SABI" proof page with anyone.
 */
export async function GET(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orderId = req.nextUrl.searchParams.get('orderId')?.trim();
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  const own = await sabiExecute({
    sql: `SELECT id FROM SabiOrder WHERE id = ? AND userId = ? LIMIT 1`,
    args: [orderId, session.id],
  });
  if (own.rows.length === 0) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const token = signOrderToken(orderId);
  const base = process.env.SABI_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://sability.io';
  return NextResponse.json({ success: true, token, url: `${base}/sabi/r/${token}` });
}
