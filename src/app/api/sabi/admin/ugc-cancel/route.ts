import { NextRequest, NextResponse } from 'next/server';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
import { sabiExecute } from '@/lib/tursoClient';
import { refundSabiWallet } from '@/lib/sabiWallet';

export const preferredRegion = 'sfo1';
export const dynamic = 'force-dynamic';

/**
 * SABI Admin — cancel a UGC booking and refund the buyer's escrow.
 * For disputes / stuck bookings (e.g. a creator who never accepts). Only works while the escrow
 * is still HELD (any status except completed = creator already paid, or already cancelled).
 *
 * Money-safety: mark cancelled with an atomic guarded UPDATE FIRST, then refund with the SAME
 * idempotency key the buyer-cancel path uses (`ugc-cancel-<id>`) so escrow is released EXACTLY once
 * even if the buyer also cancels.
 */
export async function POST(req: NextRequest) {
  if (!await checkSabiAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const bookingId = String(body.bookingId || '');
  if (!bookingId) return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });

  const r = await sabiExecute({ sql: `SELECT id, buyerId, escrowKobo, status FROM UGCBooking WHERE id = ? LIMIT 1`, args: [bookingId] });
  const b = (r.rows as any[])[0];
  if (!b) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  if (String(b.status) === 'completed') return NextResponse.json({ error: 'Already completed — the creator has been paid, so escrow can\'t be refunded.' }, { status: 400 });
  if (String(b.status) === 'cancelled') return NextResponse.json({ error: 'Already cancelled.' }, { status: 400 });

  // Atomic guard — flip to cancelled only if escrow is still held. Blocks double refunds.
  const upd = await sabiExecute({
    sql: `UPDATE UGCBooking SET status = 'cancelled', updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND status NOT IN ('completed','cancelled')`,
    args: [bookingId],
  });
  if (Number((upd as any).rowsAffected || 0) === 0) return NextResponse.json({ error: 'Booking changed — refresh and retry.' }, { status: 409 });

  const escrow = Number(b.escrowKobo || 0);
  if (escrow > 0 && b.buyerId) {
    await refundSabiWallet(String(b.buyerId), escrow, `ugc-cancel-${bookingId}`, 'UGC booking cancelled by admin — escrow refunded').catch(() => {});
  }
  return NextResponse.json({ success: true, message: `Cancelled and refunded ₦${Math.round(escrow / 100).toLocaleString()} to the buyer.` });
}
