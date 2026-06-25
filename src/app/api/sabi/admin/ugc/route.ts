import { NextRequest, NextResponse } from 'next/server';
import { allowOwnerOrStaff } from '@/lib/sabiStaff';
import { sabiExecute } from '@/lib/tursoClient';

export const maxDuration = 15;
export const preferredRegion = 'sfo1';

/**
 * Admin oversight of UGC creator bookings (escrow-backed).
 * GET /api/sabi/admin/ugc?status=&search=
 * Read-only — money flows (escrow release / refund / payout) happen on the
 * buyer & creator routes; this is the owner/staff window into the whole pipeline.
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await allowOwnerOrStaff(req)).ok) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = (searchParams.get('search') || '').trim();

    const where: string[] = [];
    const args: any[] = [];
    if (status) { where.push('b.status = ?'); args.push(status); }
    if (search) {
      where.push('(b.id LIKE ? OR b.brandUsername LIKE ? OR b.creatorHandle LIKE ?)');
      args.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const r = await sabiExecute({
      sql: `SELECT b.id, b.buyerId, b.creatorId, b.creatorHandle, b.creatorPlatform,
                   b.listedPriceKobo, b.offeredPriceKobo, b.counterPriceKobo, b.agreedPriceKobo,
                   b.escrowKobo, b.brandUsername, b.brief, b.status, b.proofUrl,
                   b.createdAt, b.updatedAt,
                   u.email AS buyerEmail, u.name AS buyerName
            FROM UGCBooking b
            LEFT JOIN SabiUser u ON u.id = b.buyerId
            ${whereSql}
            ORDER BY b.createdAt DESC LIMIT 200`,
      args,
    });

    // Pipeline tallies so the admin sees money in escrow vs. paid out at a glance.
    const tally = await sabiExecute({
      sql: `SELECT status, COUNT(*) AS n, COALESCE(SUM(escrowKobo),0) AS kobo
            FROM UGCBooking GROUP BY status`,
      args: [],
    });

    return NextResponse.json({ success: true, bookings: r.rows, tally: tally.rows });
  } catch (e: any) {
    // Table may not exist yet on a fresh env — guide the admin to migrate.
    const msg = String(e?.message || e);
    if (msg.includes('no such table')) {
      return NextResponse.json({ success: true, bookings: [], tally: [], needsMigration: true });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
