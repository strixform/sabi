import { NextRequest, NextResponse } from 'next/server';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
import { sabiExecute } from '@/lib/tursoClient';
import { creditSabiWallet } from '@/lib/sabiWallet';

export const maxDuration = 20;
export const preferredRegion = 'sfo1';

/**
 * Diagnose why a specific user's orders aren't showing.
 * GET /api/sabi/admin/diagnose-user?email=foo@bar.com   (admin only)
 *
 * Shows the user's id and whether SabiOrder rows actually exist under that id —
 * distinguishes a real "no orders" from a userId/session mismatch.
 */
export async function GET(req: NextRequest) {
  if (!await checkSabiAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const email = (req.nextUrl.searchParams.get('email') || '').trim().toLowerCase();
  const doRefund = req.nextUrl.searchParams.get('refund') === 'YES';
  if (!email) return NextResponse.json({ error: 'email query param required' }, { status: 400 });

  try {
    // Find the user(s) with this email (case-insensitive).
    const users = await sabiExecute({
      sql: `SELECT id, email, name, createdAt FROM SabiUser WHERE lower(email) = ? LIMIT 5`,
      args: [email],
    });
    if (users.rows.length === 0) {
      return NextResponse.json({ found: false, note: 'No SabiUser with that email.' });
    }

    const report: any[] = [];
    for (const u of users.rows as any[]) {
      const cnt = await sabiExecute({ sql: `SELECT COUNT(*) AS c FROM SabiOrder WHERE userId = ?`, args: [u.id] });
      const sample = await sabiExecute({
        sql: `SELECT id, serviceType, quantity, status, createdAt FROM SabiOrder WHERE userId = ? ORDER BY createdAt DESC LIMIT 5`,
        args: [u.id],
      });
      // Wallet — did money move without orders?
      let wallet: any = null;
      try {
        const w = await sabiExecute({ sql: `SELECT balance, totalFunded, totalSpent, totalRefunded FROM SabiWallet WHERE userId = ? LIMIT 1`, args: [u.id] });
        const row = w.rows[0] as any;
        if (row) wallet = { balanceNaira: Math.round(Number(row.balance || 0) / 100), totalFundedNaira: Math.round(Number(row.totalFunded || 0) / 100), totalSpentNaira: Math.round(Number(row.totalSpent || 0) / 100), totalRefundedNaira: Math.round(Number(row.totalRefunded || 0) / 100) };
      } catch {}
      // "Unaccounted spend" = money debited that has no matching order
      // (the charged-without-order bug). accounted = sum of charges across their
      // actual orders; anything spent beyond that was taken without an order.
      let unaccountedKobo = 0;
      try {
        const acc = await sabiExecute({ sql: `SELECT COALESCE(SUM(totalPrice + platformFee - COALESCE(discountAmount,0)),0) AS a FROM SabiOrder WHERE userId = ?`, args: [u.id] });
        const w2 = await sabiExecute({ sql: `SELECT totalSpent FROM SabiWallet WHERE userId = ? LIMIT 1`, args: [u.id] });
        // Engine refunds (this tool + stuck-charges) credit back as 'fund' rows but
        // don't reduce totalSpent — subtract them so an already-refunded user reads 0
        // instead of appearing to still be owed.
        const ref = await sabiExecute({ sql: `SELECT COALESCE(SUM(amount),0) AS r FROM SabiTransaction WHERE userId = ? AND type = 'fund' AND reference LIKE 'engine-refund:%'`, args: [u.id] });
        const accountedKobo = Number((acc.rows[0] as any)?.a || 0);
        const spentKobo = Number((w2.rows[0] as any)?.totalSpent || 0);
        const priorRefundKobo = Number((ref.rows[0] as any)?.r || 0);
        unaccountedKobo = Math.max(0, spentKobo - accountedKobo - priorRefundKobo);
      } catch {}

      // Optional one-time refund of the unaccounted spend (idempotent: fixed ref).
      let refunded: number | null = null;
      if (doRefund && unaccountedKobo > 0) {
        const credit = await creditSabiWallet(u.id, unaccountedKobo, `engine-refund:${u.id}`).catch(() => ({ success: false } as any));
        if (credit.success) refunded = Math.round(unaccountedKobo / 100);
      }

      report.push({
        userId: u.id,
        email: u.email,
        name: u.name,
        orderCount: Number((cnt.rows[0] as any)?.c || 0),
        wallet,
        unaccountedSpendNaira: Math.round(unaccountedKobo / 100),
        refundedNaira: refunded,
        recentOrders: (sample.rows as any[]).map(o => ({ id: o.id, serviceType: o.serviceType, quantity: o.quantity, status: o.status, createdAt: o.createdAt })),
      });
    }

    // Also check for orders whose userId is the email itself (legacy/mismatch).
    const byEmail = await sabiExecute({ sql: `SELECT COUNT(*) AS c FROM SabiOrder WHERE lower(userId) = ?`, args: [email] });
    const ordersUnderEmail = Number((byEmail.rows[0] as any)?.c || 0);

    return NextResponse.json({
      found: true,
      accounts: report,
      duplicateAccounts: users.rows.length > 1,
      ordersStoredUnderEmailAsUserId: ordersUnderEmail,
      note: report.some(r => r.orderCount > 0)
        ? 'Orders exist under this user id — if the page is empty it is a session/cache issue, not data. Have them hard-refresh.'
        : (ordersUnderEmail > 0
            ? 'Orders are stored with the EMAIL as userId, not the account id — a data mismatch to migrate.'
            : (users.rows.length > 1
                ? 'Multiple accounts share this email — orders may be under the other account id.'
                : 'This user genuinely has no orders under their id.')),
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Diagnose failed', detail: e?.message }, { status: 500 });
  }
}
