import { NextRequest, NextResponse } from 'next/server';
import { sabiExecute } from '@/lib/tursoClient';

export const maxDuration = 25;
export const preferredRegion = 'sfo1';

/**
 * Creator-side bookings — token-gated, called by gamerz360's creator dashboard
 * (SABI owns the bookings + escrow; gamerz360 is just the creator's UI). The
 * caller passes the creator's UGCCreator id (verified on the gamerz360 side as
 * belonging to the logged-in tasker).
 *
 * GET  ?creatorId=        → that creator's bookings
 * POST { creatorId, bookingId, action: 'accept'|'reject'|'counter'|'deliver', counterNaira?, proofUrl? }
 *   accept  : agree the offered price → status 'accepted'
 *   counter : propose a new price (only while negotiating) → status stays 'negotiating'
 *   reject  : decline → status 'rejected' (buyer is refunded by the buyer-side route on next view, or immediately here)
 *   deliver : creator posted → store proof → status 'delivered' (awaiting buyer confirm)
 */
function authed(req: NextRequest): boolean {
  const h = req.headers.get('authorization');
  return !!h && h.startsWith('Bearer ') && h.substring(7) === process.env.SABI_INTEGRATION_TOKEN;
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const creatorId = (req.nextUrl.searchParams.get('creatorId') || '').trim();
  if (!creatorId) return NextResponse.json({ error: 'creatorId required' }, { status: 400 });
  try {
    const r = await sabiExecute({
      sql: `SELECT id, creatorHandle, creatorPlatform, listedPriceKobo, offeredPriceKobo, counterPriceKobo,
                   agreedPriceKobo, escrowKobo, brandUsername, brief, status, proofUrl, createdAt
            FROM UGCBooking WHERE creatorId = ? ORDER BY createdAt DESC LIMIT 100`,
      args: [creatorId],
    });
    return NextResponse.json({ success: true, bookings: r.rows });
  } catch {
    return NextResponse.json({ success: true, bookings: [] });
  }
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const creatorId = String(body.creatorId || '');
  const bookingId = String(body.bookingId || '');
  const action = String(body.action || '');
  if (!creatorId || !bookingId) return NextResponse.json({ error: 'creatorId and bookingId required' }, { status: 400 });

  const r = await sabiExecute({ sql: `SELECT id, escrowKobo, offeredPriceKobo, status FROM UGCBooking WHERE id = ? AND creatorId = ? LIMIT 1`, args: [bookingId, creatorId] });
  const b = r.rows[0] as any;
  if (!b) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  const status = String(b.status);

  if (action === 'accept') {
    if (!['pending_creator', 'negotiating'].includes(status)) return NextResponse.json({ error: 'Cannot accept now.' }, { status: 400 });
    await sabiExecute({ sql: `UPDATE UGCBooking SET status='accepted', agreedPriceKobo = escrowKobo, updatedAt=CURRENT_TIMESTAMP WHERE id=? AND status IN ('pending_creator','negotiating')`, args: [bookingId] });
    return NextResponse.json({ success: true, message: 'Accepted. Create the content, then mark it delivered.' });
  }

  if (action === 'counter') {
    if (status !== 'negotiating') return NextResponse.json({ error: 'Can only counter while negotiating.' }, { status: 400 });
    const counterKobo = Math.max(0, Math.round(Number(body.counterNaira) * 100) || 0);
    if (counterKobo <= 0) return NextResponse.json({ error: 'Enter a counter price.' }, { status: 400 });
    await sabiExecute({ sql: `UPDATE UGCBooking SET counterPriceKobo=?, updatedAt=CURRENT_TIMESTAMP WHERE id=? AND status='negotiating'`, args: [counterKobo, bookingId] });
    return NextResponse.json({ success: true, message: 'Counter offer sent to the buyer.' });
  }

  if (action === 'reject') {
    if (!['pending_creator', 'negotiating'].includes(status)) return NextResponse.json({ error: 'Cannot reject now.' }, { status: 400 });
    // Atomic flip, then refund the held escrow to the buyer.
    const upd = await sabiExecute({ sql: `UPDATE UGCBooking SET status='rejected', updatedAt=CURRENT_TIMESTAMP WHERE id=? AND status IN ('pending_creator','negotiating')`, args: [bookingId] });
    if (Number((upd as any).rowsAffected || 0) > 0) {
      const { refundSabiWallet } = await import('@/lib/sabiWallet');
      const buyer = await sabiExecute({ sql: `SELECT buyerId FROM UGCBooking WHERE id = ? LIMIT 1`, args: [bookingId] });
      const buyerId = (buyer.rows[0] as any)?.buyerId;
      if (buyerId) await refundSabiWallet(buyerId, Number(b.escrowKobo || 0), `ugc-reject-${bookingId}`, 'UGC booking declined by creator — refunded').catch(() => {});
    }
    return NextResponse.json({ success: true, message: 'Declined. The buyer has been refunded.' });
  }

  if (action === 'deliver') {
    if (status !== 'accepted') return NextResponse.json({ error: 'Accept the booking first.' }, { status: 400 });
    const proofUrl = String(body.proofUrl || '').trim();
    if (!proofUrl) return NextResponse.json({ error: 'Upload a screenshot of your post.' }, { status: 400 });
    await sabiExecute({ sql: `UPDATE UGCBooking SET status='delivered', proofUrl=?, updatedAt=CURRENT_TIMESTAMP WHERE id=? AND status='accepted'`, args: [proofUrl, bookingId] });
    return NextResponse.json({ success: true, message: 'Marked delivered. Waiting for the buyer to confirm — then you get paid.' });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
