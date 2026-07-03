import { NextRequest, NextResponse } from 'next/server';
import { sabiExecute } from '@/lib/tursoClient';
import { allowOwnerOrStaff } from '@/lib/sabiStaff';

export const maxDuration = 30;
export const preferredRegion = 'sfo1';

/**
 * Wallet reconciliation — rebuild the TRUE balance from ground truth.
 *
 * WHY the simple "-totalSpent" audit was not enough:
 *   The double-refund cron did `balance += X, totalSpent -= X` on each phantom
 *   refund. That KEEPS the invariant `balance = totalFunded - totalSpent`, so the
 *   corruption is invisible in the balance/totalSpent pair alone — it just inflates
 *   balance and deflates totalSpent by the same (possibly huge) amount. On an active
 *   account the inflation dwarfs the tiny slice that pushes totalSpent below zero.
 *
 * GROUND TRUTH that the bug never touched:
 *   - `totalFunded` — only ever incremented by real funding; refunds never touch it.
 *   - each order's status + amounts — set at placement / delivery, not by the refund path.
 *
 * So the true net spend is reconstructable per order, independent of the broken
 * refund accounting:
 *     charge          = totalPrice + platformFee - discountAmount      (debited at placement)
 *     completed (full)= charge                                          (kept in full)
 *     completed(part) = charge - proRataRemainderRefund                 (kept the delivered slice)
 *     failed/cancelled= 0                                               (fully refunded)
 *     pending/processing/executing = charge                            (money still committed)
 *
 *     trueTotalSpent  = Σ netSpent
 *     trueBalance     = max(0, totalFunded - trueTotalSpent)
 *
 * GET  ?userId= | ?email=  → dry-run report (current vs reconstructed + full breakdown).
 * POST { action:'apply', userId }              → write the reconstructed balance/totalSpent.
 * POST { action:'set', userId, balanceKobo, totalSpentKobo } → manual override (last resort).
 * Owner only.
 */

type Recon = {
  userId: string;
  email: string | null;
  wallet: { balanceKobo: number; totalFundedKobo: number; totalSpentKobo: number; totalRefundedKobo: number };
  orders: {
    total: number;
    byStatus: Record<string, { count: number; chargeKobo: number; netSpentKobo: number }>;
  };
  ledger: Record<string, { count: number; sumKobo: number }>;
  reconstructed: {
    trueTotalSpentKobo: number;
    trueBalanceKobo: number;
    deltaBalanceKobo: number;   // current - reconstructed (how inflated it is)
    ledgerBalanceKobo: number;  // independent cross-check from the txn ledger
  };
};

async function reconcile(userIdOrEmail: string, byEmail: boolean): Promise<Recon | null> {
  const wq = byEmail
    ? { sql: `SELECT w.userId, u.email, w.balance, w.totalFunded, w.totalSpent, w.totalRefunded
              FROM SabiWallet w JOIN SabiUser u ON u.id = w.userId WHERE lower(u.email) = lower(?) LIMIT 1`, args: [userIdOrEmail] }
    : { sql: `SELECT w.userId, u.email, w.balance, w.totalFunded, w.totalSpent, w.totalRefunded
              FROM SabiWallet w LEFT JOIN SabiUser u ON u.id = w.userId WHERE w.userId = ? LIMIT 1`, args: [userIdOrEmail] };
  const wr = await sabiExecute(wq).catch(() => ({ rows: [] as any[] }));
  const w = (wr.rows as any[])[0];
  if (!w) return null;
  const userId = String(w.userId);

  // All orders — status + the amounts fixed at placement (never touched by refunds).
  const or = await sabiExecute({
    sql: `SELECT status, quantity, completedQuantity, totalPrice, platformFee, discountAmount
          FROM SabiOrder WHERE userId = ?`,
    args: [userId],
  }).catch(() => ({ rows: [] as any[] }));

  const byStatus: Record<string, { count: number; chargeKobo: number; netSpentKobo: number }> = {};
  let trueTotalSpent = 0;
  for (const o of or.rows as any[]) {
    const status = String(o.status || 'unknown');
    const quantity = Number(o.quantity || 0);
    const done = Number(o.completedQuantity || 0);
    const charge = Number(o.totalPrice || 0) + Number(o.platformFee || 0) - Number(o.discountAmount || 0);

    let netSpent: number;
    if (status === 'failed' || status === 'cancelled') {
      netSpent = 0;                                   // fully refunded
    } else if (status === 'completed' && quantity > 0 && done < quantity) {
      const remainder = quantity - done;              // partial: service remainder refunded pro-rata, fee kept
      const remRefund = Math.round((Number(o.totalPrice || 0) / quantity) * remainder);
      netSpent = Math.max(0, charge - remRefund);
    } else {
      netSpent = Math.max(0, charge);                 // completed-full OR still committed (pending/processing/executing)
    }

    const b = (byStatus[status] ||= { count: 0, chargeKobo: 0, netSpentKobo: 0 });
    b.count += 1;
    b.chargeKobo += Math.max(0, charge);
    b.netSpentKobo += netSpent;
    trueTotalSpent += netSpent;
  }

  // Independent cross-check: the signed transaction ledger.
  const tr = await sabiExecute({
    sql: `SELECT type, COUNT(*) AS c, SUM(amount) AS s FROM SabiTransaction WHERE userId = ? GROUP BY type`,
    args: [userId],
  }).catch(() => ({ rows: [] as any[] }));
  const ledger: Record<string, { count: number; sumKobo: number }> = {};
  for (const t of tr.rows as any[]) ledger[String(t.type)] = { count: Number(t.c || 0), sumKobo: Number(t.s || 0) };
  const lg = (k: string) => ledger[k]?.sumKobo || 0;
  const ledgerBalance = lg('fund') + lg('bonus') + lg('refund') - lg('spend'); // fund_pending excluded (not yet credited)

  const totalFunded = Number(w.totalFunded || 0);
  const trueBalance = Math.max(0, totalFunded - trueTotalSpent);

  return {
    userId,
    email: w.email || null,
    wallet: {
      balanceKobo: Number(w.balance || 0),
      totalFundedKobo: totalFunded,
      totalSpentKobo: Number(w.totalSpent || 0),
      totalRefundedKobo: Number(w.totalRefunded || 0),
    },
    orders: { total: (or.rows as any[]).length, byStatus },
    ledger,
    reconstructed: {
      trueTotalSpentKobo: trueTotalSpent,
      trueBalanceKobo: trueBalance,
      deltaBalanceKobo: Number(w.balance || 0) - trueBalance,
      ledgerBalanceKobo: ledgerBalance,
    },
  };
}

/**
 * Bulk scan — reconstruct every wallet's true balance in one aggregate pass and
 * flag the ones the double-refund inflated (displayed balance > true balance by
 * more than `thresholdKobo`). Uses the SAME per-order net-spend logic as reconcile(),
 * expressed in SQL. Only flags INFLATION (never auto-credits an under-stated wallet).
 */
async function scanAll(thresholdKobo: number) {
  const NET_SPENT = `
    CASE
      WHEN o.status IN ('failed','cancelled') THEN 0
      WHEN o.status = 'completed' AND o.quantity > 0 AND COALESCE(o.completedQuantity,0) < o.quantity
        THEN MAX(0, (o.totalPrice + o.platformFee - COALESCE(o.discountAmount,0))
                     - CAST(ROUND((CAST(o.totalPrice AS REAL) / o.quantity) * (o.quantity - COALESCE(o.completedQuantity,0))) AS INTEGER))
      ELSE MAX(0, o.totalPrice + o.platformFee - COALESCE(o.discountAmount,0))
    END`;

  const r = await sabiExecute({
    sql: `
      SELECT w.userId, u.email, w.balance, w.totalFunded,
             COALESCE(s.netSpent, 0) AS netSpent,
             MAX(0, w.totalFunded - COALESCE(s.netSpent, 0)) AS trueBalance
      FROM SabiWallet w
      LEFT JOIN SabiUser u ON u.id = w.userId
      LEFT JOIN (
        SELECT o.userId AS userId, SUM(${NET_SPENT}) AS netSpent
        FROM SabiOrder o GROUP BY o.userId
      ) s ON s.userId = w.userId
      WHERE (w.balance - MAX(0, w.totalFunded - COALESCE(s.netSpent, 0))) > ?
      ORDER BY (w.balance - MAX(0, w.totalFunded - COALESCE(s.netSpent, 0))) DESC
      LIMIT 1000`,
    args: [thresholdKobo],
  }).catch(() => ({ rows: [] as any[] }));

  const affected = (r.rows as any[]).map((x) => ({
    userId: String(x.userId),
    email: x.email || null,
    balanceKobo: Number(x.balance || 0),
    totalFundedKobo: Number(x.totalFunded || 0),
    trueBalanceKobo: Number(x.trueBalance || 0),
    trueTotalSpentKobo: Number(x.netSpent || 0),
    inflatedByKobo: Number(x.balance || 0) - Number(x.trueBalance || 0),
  }));
  const totalInflatedKobo = affected.reduce((s, a) => s + a.inflatedByKobo, 0);
  return { affectedCount: affected.length, totalInflatedNaira: Math.round(totalInflatedKobo / 100), thresholdKobo, affected };
}

export async function GET(req: NextRequest) {
  const auth = await allowOwnerOrStaff(req);
  if (!auth.ok || auth.role !== 'owner') return NextResponse.json({ error: 'Owner only' }, { status: 403 });

  const url = new URL(req.url);

  // Fleet-wide scan: ?scan=1[&threshold=<kobo>] — dry run, lists every inflated wallet.
  if (url.searchParams.get('scan')) {
    const threshold = Math.max(0, Math.round(Number(url.searchParams.get('threshold') || 1000)));
    return NextResponse.json(await scanAll(threshold));
  }

  const email = url.searchParams.get('email');
  const userId = url.searchParams.get('userId');
  if (!email && !userId) return NextResponse.json({ error: 'Pass ?userId=, ?email=, or ?scan=1' }, { status: 400 });

  const r = await reconcile((email || userId)!, !!email);
  if (!r) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
  return NextResponse.json(r);
}

export async function POST(req: NextRequest) {
  const auth = await allowOwnerOrStaff(req);
  if (!auth.ok || auth.role !== 'owner') return NextResponse.json({ error: 'Owner only' }, { status: 403 });

  const body = await req.json().catch(() => ({}));

  if (body.action === 'apply-all') {
    // Fleet-wide correction: reconstruct + write every inflated wallet.
    const threshold = Math.max(0, Math.round(Number(body.threshold ?? 1000)));
    const scan = await scanAll(threshold);
    let fixed = 0;
    for (const a of scan.affected) {
      const res = await sabiExecute({
        sql: `UPDATE SabiWallet SET balance = ?, totalSpent = ?, updatedAt = datetime('now') WHERE userId = ? AND balance = ?`,
        args: [a.trueBalanceKobo, a.trueTotalSpentKobo, a.userId, a.balanceKobo],
      }).catch(() => ({ rowsAffected: 0 } as any));
      if (Number((res as any).rowsAffected ?? 0) === 1) fixed += 1;
    }
    return NextResponse.json({
      ok: true, scanned: scan.affectedCount, fixed,
      totalRecoveredNaira: scan.totalInflatedNaira,
      affected: scan.affected,
    });
  }

  const userId = body.userId ? String(body.userId) : null;
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  if (body.action === 'set') {
    // Manual override — set exact values after eyeballing the report.
    const balanceKobo = Math.max(0, Math.round(Number(body.balanceKobo)));
    const totalSpentKobo = Math.max(0, Math.round(Number(body.totalSpentKobo)));
    if (!Number.isFinite(balanceKobo) || !Number.isFinite(totalSpentKobo)) {
      return NextResponse.json({ error: 'balanceKobo and totalSpentKobo required' }, { status: 400 });
    }
    await sabiExecute({
      sql: `UPDATE SabiWallet SET balance = ?, totalSpent = ?, updatedAt = datetime('now') WHERE userId = ?`,
      args: [balanceKobo, totalSpentKobo, userId],
    });
    return NextResponse.json({ ok: true, applied: { balanceKobo, totalSpentKobo } });
  }

  if (body.action === 'apply') {
    // Recompute server-side (never trust client numbers) and write the reconstructed truth.
    const r = await reconcile(userId, false);
    if (!r) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    await sabiExecute({
      sql: `UPDATE SabiWallet SET balance = ?, totalSpent = ?, updatedAt = datetime('now') WHERE userId = ?`,
      args: [r.reconstructed.trueBalanceKobo, r.reconstructed.trueTotalSpentKobo, userId],
    });
    return NextResponse.json({
      ok: true,
      before: { balanceKobo: r.wallet.balanceKobo, totalSpentKobo: r.wallet.totalSpentKobo },
      after: { balanceKobo: r.reconstructed.trueBalanceKobo, totalSpentKobo: r.reconstructed.trueTotalSpentKobo },
      recoveredKobo: r.reconstructed.deltaBalanceKobo,
    });
  }

  return NextResponse.json({ error: "Unknown action (use 'apply' or 'set')" }, { status: 400 });
}
