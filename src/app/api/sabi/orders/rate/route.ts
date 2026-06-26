import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { sabiExecute } from '@/lib/tursoClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;
export const preferredRegion = 'sfo1';

/**
 * Buyer rates a completed order (1-5). Stored once per order, then forwarded to
 * gamerz360 which blends it into the ratingAvg of every tasker who worked the
 * campaign (EMA) — good contributors rise, poor ones get throttled. Idempotent —
 * re-rating is blocked so the signal stays honest.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSabiSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { orderId, rating, note } = await req.json().catch(() => ({}));
    const r = Math.round(Number(rating));
    if (!orderId || !(r >= 1 && r <= 5)) {
      return NextResponse.json({ error: 'orderId and a 1-5 rating are required.' }, { status: 400 });
    }
    const ratingNote = String(note || '').trim().slice(0, 300) || null;

    // Must be the buyer's own completed order, not yet rated.
    const found = await sabiExecute({
      sql: `SELECT id, status, COALESCE(rating,0) AS rating, gamesz360CampaignId
            FROM SabiOrder WHERE id = ? AND userId = ? LIMIT 1`,
      args: [orderId, session.id],
    });
    const order = found.rows[0] as any;
    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    if (order.status !== 'completed') return NextResponse.json({ error: 'You can only rate completed orders.' }, { status: 400 });
    if (Number(order.rating) > 0) return NextResponse.json({ error: 'You already rated this order.' }, { status: 409 });

    const upd = await sabiExecute({
      sql: `UPDATE SabiOrder SET rating = ?, ratingNote = ? WHERE id = ? AND userId = ? AND COALESCE(rating,0) = 0`,
      args: [r, ratingNote, orderId, session.id],
    });
    if (Number((upd as any).rowsAffected || 0) === 0) {
      return NextResponse.json({ error: 'Already rated.' }, { status: 409 });
    }

    // Feed the rating into the contributing taskers' quality scores (fire-and-forget).
    // gamerz360 keys off sabiOrderId (= this order's id) and EMA-blends ratingAvg.
    {
      const g360 = process.env.GAMERZ360_API_URL || 'https://gamerz360.com';
      fetch(`${g360}/api/admin/sabi/order-rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SABI_INTEGRATION_TOKEN}`,
          'User-Agent': 'Mozilla/5.0 (compatible; SABI-Integration/1.0)',
        },
        body: JSON.stringify({ sabiOrderId: orderId, rating: r, comment: ratingNote }),
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, rating: r });
  } catch (e: any) {
    return NextResponse.json({ error: 'Could not save rating.' }, { status: 500 });
  }
}
