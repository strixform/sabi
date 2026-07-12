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
        const w2 = await sabiExecute({ sql: `SELECT totalSpent, totalRefunded FROM SabiWallet WHERE userId = ? LIMIT 1`, args: [u.id] });
        // Engine refunds (this tool + stuck-charges) credit back as 'fund' rows but
        // don't reduce totalSpent — subtract them so an already-refunded user reads 0
        // instead of appearing to still be owed.
        const ref = await sabiExecute({ sql: `SELECT COALESCE(SUM(amount),0) AS r FROM SabiTransaction WHERE userId = ? AND type = 'fund' AND reference LIKE 'engine-refund:%'`, args: [u.id] });
        const accountedKobo = Number((acc.rows[0] as any)?.a || 0);
        const spentKobo = Number((w2.rows[0] as any)?.totalSpent || 0);
        const normalRefundKobo = Number((w2.rows[0] as any)?.totalRefunded || 0);
        const priorRefundKobo = Number((ref.rows[0] as any)?.r || 0);
        // Subtract BOTH normal 'refund' txns (auto-refund on failed create / cancellations)
        // AND this tool's engine-refunds — so an already-refunded user reads 0 (no double refund).
        unaccountedKobo = Math.max(0, spentKobo - accountedKobo - normalRefundKobo - priorRefundKobo);
      } catch {}

      // Optional one-time refund of the unaccounted spend (idempotent: fixed ref).
      let refunded: number | null = null;
      if (doRefund && unaccountedKobo > 0) {
        const credit = await creditSabiWallet(u.id, unaccountedKobo, `engine-refund:${u.id}`).catch(() => ({ success: false } as any));
        if (credit.success) refunded = Math.round(unaccountedKobo / 100);
      }

      // FULL AUDIT — every order (with its charge) and every wallet transaction, so a
      // balance dispute can be traced line by line. Amounts in naira.
      const N = (k: any) => Math.round(Number(k || 0) / 100);
      const ordersDetailed = await sabiExecute({
        sql: `SELECT id, serviceType, quantity, COALESCE(completedQuantity,0) AS completedQuantity, status,
                     totalPrice, platformFee, COALESCE(discountAmount,0) AS discountAmount, createdAt
              FROM SabiOrder WHERE userId = ? ORDER BY createdAt DESC LIMIT 100`,
        args: [u.id],
      }).catch(() => ({ rows: [] as any[] }));
      const txns = await sabiExecute({
        sql: `SELECT type, amount, reference, description, createdAt FROM SabiTransaction WHERE userId = ? ORDER BY createdAt DESC LIMIT 200`,
        args: [u.id],
      }).catch(() => ({ rows: [] as any[] }));

      // Transaction totals by type (independent of the Wallet counters).
      const txByType: Record<string, number> = {};
      for (const t of txns.rows as any[]) txByType[String(t.type)] = (txByType[String(t.type)] || 0) + Number(t.amount || 0);

      // Balance invariant: balance should equal totalFunded − totalSpent (refunds
      // increase balance AND decrease totalSpent, so they cancel). A mismatch = a bug.
      let balanceCheck: any = null;
      try {
        const w3 = await sabiExecute({ sql: `SELECT balance, totalFunded, totalSpent FROM SabiWallet WHERE userId = ? LIMIT 1`, args: [u.id] });
        const row = w3.rows[0] as any;
        if (row) {
          const reconstructed = Number(row.totalFunded || 0) - Number(row.totalSpent || 0);
          balanceCheck = { actualBalanceNaira: N(row.balance), reconstructedNaira: N(reconstructed), matches: Math.abs(reconstructed - Number(row.balance || 0)) < 100 };
        }
      } catch {}

      report.push({
        userId: u.id,
        email: u.email,
        name: u.name,
        orderCount: Number((cnt.rows[0] as any)?.c || 0),
        wallet,
        balanceCheck,
        unaccountedSpendNaira: Math.round(unaccountedKobo / 100),
        refundedNaira: refunded,
        txTotalsNaira: { funded: N(txByType.fund), spent: N(txByType.spend), refund: N(txByType.refund) },
        transactions: (txns.rows as any[]).map(t => ({ type: t.type, naira: N(t.amount), reference: t.reference, description: t.description, at: t.createdAt })),
        orders: (ordersDetailed.rows as any[]).map(o => ({ id: o.id, serviceType: o.serviceType, quantity: o.quantity, delivered: Number(o.completedQuantity || 0), status: o.status, chargeNaira: N(Number(o.totalPrice || 0) + Number(o.platformFee || 0) - Number(o.discountAmount || 0)), at: o.createdAt })),
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
