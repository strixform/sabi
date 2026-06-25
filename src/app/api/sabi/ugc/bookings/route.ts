import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { sabiExecute } from '@/lib/tursoClient';
import { debitSabiWallet, refundSabiWallet } from '@/lib/sabiWallet';
import crypto from 'crypto';

export const maxDuration = 25;
export const preferredRegion = 'sfo1';

const G360_URL = process.env.GAMERZ360_API_URL || 'https://gamerz360.com';

/**
 * UGC bookings (stage c). Escrow-backed:
 *  • POST create → validate creator, HOLD escrow (debit buyer wallet), insert booking.
 *  • GET        → the buyer's bookings.
 *  • POST { action:'cancel', bookingId } → refund escrow (only before delivery).
 *
 * Money rule: escrow is debited ONCE on create and released EXACTLY once — refund
 * here (cancel/reject) or payout to the creator on buyer confirmation (separate
 * route). Status guards prevent a double release.
 */
export async function GET() {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const r = await sabiExecute({
      sql: `SELECT id, creatorId, creatorHandle, creatorPlatform, listedPriceKobo, offeredPriceKobo,
                   counterPriceKobo, agreedPriceKobo, escrowKobo, brandUsername, brief, status, proofUrl, createdAt
            FROM UGCBooking WHERE buyerId = ? ORDER BY createdAt DESC LIMIT 100`,
      args: [session.id],
    });
    return NextResponse.json({ success: true, bookings: r.rows });
  } catch {
    return NextResponse.json({ success: true, bookings: [] });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  // ── CANCEL → refund escrow (only while still cancellable) ──────────────────
  if (body.action === 'cancel') {
    const bookingId = String(body.bookingId || '');
    const r = await sabiExecute({ sql: `SELECT id, escrowKobo, status FROM UGCBooking WHERE id = ? AND buyerId = ? LIMIT 1`, args: [bookingId, session.id] });
    const b = r.rows[0] as any;
    if (!b) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (!['pending_creator', 'negotiating'].includes(String(b.status))) {
      return NextResponse.json({ error: 'This booking can no longer be cancelled.' }, { status: 400 });
    }
    // Mark cancelled FIRST (atomic guard) so a double-click can't refund twice.
    const upd = await sabiExecute({
      sql: `UPDATE UGCBooking SET status = 'cancelled', updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND status IN ('pending_creator','negotiating')`,
      args: [bookingId],
    });
    if (Number((upd as any).rowsAffected || 0) === 0) return NextResponse.json({ error: 'Already updated.' }, { status: 409 });
    await refundSabiWallet(session.id, Number(b.escrowKobo || 0), `ugc-cancel-${bookingId}`, 'UGC booking cancelled — escrow refunded').catch(() => {});
    return NextResponse.json({ success: true, message: 'Booking cancelled and refunded.' });
  }

  // ── CREATE → validate creator, hold escrow ────────────────────────────────
  const creatorId = String(body.creatorId || '');
  const brief = String(body.brief || '').trim().slice(0, 1000);
  const brandUsername = String(body.brandUsername || '').trim().slice(0, 80);
  const offered = Math.max(0, Math.round(Number(body.offeredPriceKobo) || 0)); // kobo; 0 = book at list price
  if (!creatorId) return NextResponse.json({ error: 'Pick a creator.' }, { status: 400 });

  // Fetch the creator's live listing from gamerz360 (price + negotiable + status).
  const token = process.env.SABI_INTEGRATION_TOKEN;
  if (!token) return NextResponse.json({ error: 'Bookings are not available right now.' }, { status: 503 });
  let creator: any = null;
  try {
    const cr = await fetch(`${G360_URL}/api/admin/sabi/ugc-creators?id=${encodeURIComponent(creatorId)}`, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'Mozilla/5.0 (compatible; SABI-Integration/1.0)' },
    });
    const cd = await cr.json().catch(() => ({}));
    creator = cd?.creator || null;
  } catch {}
  if (!creator || creator.status !== 'approved') {
    return NextResponse.json({ error: 'This creator is not available.' }, { status: 400 });
  }

  const listed = Math.max(0, Number(creator.priceKobo || 0));
  // Negotiation: a below-list offer is only honoured if the creator is negotiable;
  // otherwise we book at the list price. The escrow we hold = what the buyer commits.
  let escrow = listed;
  let status = 'pending_creator';
  let offeredStored = listed;
  if (offered > 0 && offered < listed) {
    if (creator.negotiable) { escrow = offered; offeredStored = offered; status = 'negotiating'; }
    else { escrow = listed; offeredStored = listed; status = 'pending_creator'; }
  } else if (offered >= listed && offered > 0) {
    escrow = offered; offeredStored = offered;
  }
  if (escrow <= 0) return NextResponse.json({ error: 'This creator has no price set yet.' }, { status: 400 });

  // Hold escrow — debit the buyer's wallet now.
  const bookingId = crypto.randomUUID();
  const debit = await debitSabiWallet(session.id, escrow, `ugc-escrow-${bookingId}`);
  if (!debit.success) {
    return NextResponse.json({ error: debit.error || 'Insufficient balance — fund your wallet to book.' }, { status: 400 });
  }

  try {
    await sabiExecute({
      sql: `INSERT INTO UGCBooking
              (id, buyerId, creatorId, creatorHandle, creatorPlatform, listedPriceKobo, offeredPriceKobo,
               escrowKobo, brandUsername, brief, status, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: [bookingId, session.id, creatorId, creator.handle || null, creator.platform || null,
             listed, offeredStored, escrow, brandUsername || null, brief || null, status],
    });
  } catch (e: any) {
    // Insert failed AFTER debit → refund so the buyer is never charged with no booking.
    await refundSabiWallet(session.id, escrow, `ugc-failrefund-${bookingId}`, 'UGC booking failed — auto refund').catch(() => {});
    return NextResponse.json({ error: 'Could not create the booking. Your wallet was not charged.' }, { status: 500 });
  }

  // Notify the creator side (fire-and-forget; gamerz360 emails/notifies the creator).
  fetch(`${G360_URL}/api/admin/sabi/ugc-booking-notify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; SABI-Integration/1.0)' },
    body: JSON.stringify({ creatorId, bookingId, status, offeredKobo: offeredStored, brief, brandUsername }),
  }).catch(() => {});

  return NextResponse.json({
    success: true, bookingId, status, escrowNaira: Math.round(escrow / 100),
    message: status === 'negotiating'
      ? 'Offer sent to the creator. They can accept, counter, or decline — your funds are held safely until then.'
      : 'Booking placed! The creator has been notified. Your funds are held in escrow until you confirm delivery.',
  });
}
