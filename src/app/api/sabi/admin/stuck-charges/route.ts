import { NextRequest, NextResponse } from 'next/server';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
import { sabiExecute } from '@/lib/tursoClient';
import { creditSabiWallet } from '@/lib/sabiWallet';
import { listPartnerships } from '@/lib/sabiPartnership';

export const maxDuration = 60;
export const preferredRegion = 'sfo1';

/**
 * Find (and refund) buyers hit by the charged-without-order bug.
 *
 * Conservative, unambiguous criterion only: wallet.totalSpent > 0 AND
 * totalRefunded = 0 AND the user has ZERO orders (and isn't a Partnership
 * payer, whose ₦100k debit legitimately has no order). For these users the
 * entire `totalSpent` was taken without delivering anything → refund it.
 *
 * GET  /api/sabi/admin/stuck-charges          → scan + total exposure
 * GET  /api/sabi/admin/stuck-charges?fix=YES  → refund all (idempotent)
 */
export async function GET(req: NextRequest) {
  if (!await checkSabiAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const fix = req.nextUrl.searchParams.get('fix') === 'YES';

  // Exclude Partnership payers (their debit has no order by design).
  let partnerIds = new Set<string>();
  try { partnerIds = new Set((await listPartnerships()).map(p => p.userId)); } catch {}

  let rows: any[] = [];
  try {
    const r = await sabiExecute({
      sql: `SELECT w.userId AS userId, w.totalSpent AS spent
            FROM SabiWallet w
            WHERE w.totalSpent > 0 AND COALESCE(w.totalRefunded,0) = 0
              AND NOT EXISTS (SELECT 1 FROM SabiOrder o WHERE o.userId = w.userId)
            ORDER BY w.totalSpent DESC
            LIMIT 500`,
      args: [],
    });
    rows = (r.rows as any[]).filter(v => !partnerIds.has(v.userId));
  } catch (e: any) {
    return NextResponse.json({ error: 'Scan failed', detail: e?.message }, { status: 500 });
  }

  const totalKobo = rows.reduce((s, v) => s + Number(v.spent || 0), 0);

  if (!fix) {
    return NextResponse.json({
      mode: 'SCAN',
      affectedUsers: rows.length,
      totalOwedNaira: Math.round(totalKobo / 100),
      sample: rows.slice(0, 20).map(v => ({ userId: v.userId, owedNaira: Math.round(Number(v.spent) / 100) })),
      note: rows.length ? 'Re-run with ?fix=YES to refund all of them (idempotent).' : 'No charged-without-order victims found.',
    });
  }

  let refunded = 0; let refundedKobo = 0;
  for (const v of rows) {
    const amt = Number(v.spent || 0);
    if (amt <= 0) continue;
    const credit = await creditSabiWallet(v.userId, amt, `engine-refund:${v.userId}`).catch(() => ({ success: false } as any));
    if (credit.success) { refunded++; refundedKobo += amt; }
  }

  return NextResponse.json({ mode: 'REFUNDED', refundedUsers: refunded, refundedNaira: Math.round(refundedKobo / 100), of: rows.length });
}
