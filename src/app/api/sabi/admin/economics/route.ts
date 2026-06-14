import { NextRequest, NextResponse } from 'next/server';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
import { sabiExecute } from '@/lib/tursoClient';
import { getPromoSpendToday } from '@/lib/redis';

export const maxDuration = 30;
export const preferredRegion = 'sfo1';

/**
 * Balance / economics dashboard data (admin).
 * GET /api/sabi/admin/economics
 *
 * Money model: an order's `totalPrice` (base) is sent to gamerz360 as the
 * tasker budget = our COST. Revenue = charged (base + fee − discount). Margin =
 * charged − base. Refill orders (paymentMethod='refill') are pure cost (free).
 */
async function num(sql: string, args: any[] = []): Promise<number> {
  try { const r = await sabiExecute({ sql, args }); return Number((r.rows[0] as any)?.v || 0); } catch { return 0; }
}

export async function GET(_req: NextRequest) {
  if (!await checkSabiAdmin(_req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const N = (k: number) => Math.round(k / 100); // kobo → naira

  // Orders: revenue (charged), tasker cost (base), margin. All-time + 7d.
  const chargedExpr = `SUM(totalPrice + platformFee - COALESCE(discountAmount,0))`;
  const baseExpr = `SUM(totalPrice)`;
  const paidFilter = `paymentMethod != 'refill'`;

  const [
    revenueAll, costAll, revenue7d, cost7d, ordersAll, orders7d,
    refillCount, refillCostAll,
    walletBalance, totalFunded, totalSpent, totalRefunded,
  ] = await Promise.all([
    num(`SELECT ${chargedExpr} AS v FROM SabiOrder WHERE ${paidFilter}`),
    num(`SELECT ${baseExpr} AS v FROM SabiOrder`),
    num(`SELECT ${chargedExpr} AS v FROM SabiOrder WHERE ${paidFilter} AND createdAt >= datetime('now','-7 days')`),
    num(`SELECT ${baseExpr} AS v FROM SabiOrder WHERE createdAt >= datetime('now','-7 days')`),
    num(`SELECT COUNT(*) AS v FROM SabiOrder`),
    num(`SELECT COUNT(*) AS v FROM SabiOrder WHERE createdAt >= datetime('now','-7 days')`),
    num(`SELECT COUNT(*) AS v FROM SabiOrder WHERE paymentMethod = 'refill'`),
    num(`SELECT SUM(totalPrice) AS v FROM SabiOrder WHERE paymentMethod = 'refill'`),
    num(`SELECT SUM(balance) AS v FROM SabiWallet`),
    num(`SELECT SUM(totalFunded) AS v FROM SabiWallet`),
    num(`SELECT SUM(totalSpent) AS v FROM SabiWallet`),
    num(`SELECT SUM(COALESCE(totalRefunded,0)) AS v FROM SabiWallet`),
  ]);

  // Giveaways (self-creating tables — guarded inside num()).
  const cashback = await num(`SELECT SUM(amountKobo) AS v FROM SabiCashback`);
  const shortfall = await num(`SELECT SUM(amountKobo) AS v FROM SabiShortfallClaim`);
  const promoToday = await getPromoSpendToday().catch(() => 0);

  // Fraud signals: signup IPs shared by multiple accounts (referral-ring / multi-account).
  let sharedIps: { ip: string; accounts: number }[] = [];
  try {
    const r = await sabiExecute({
      sql: `SELECT signupIp AS ip, COUNT(*) AS c FROM SabiUser WHERE signupIp IS NOT NULL AND signupIp != '' GROUP BY signupIp HAVING c > 1 ORDER BY c DESC LIMIT 15`,
      args: [],
    });
    sharedIps = (r.rows as any[]).map(x => ({ ip: x.ip, accounts: Number(x.c) }));
  } catch {}

  const marginAll = revenueAll - costAll;
  const margin7d = revenue7d - cost7d;

  return NextResponse.json({
    success: true,
    allTime: {
      orders: ordersAll,
      revenueNaira: N(revenueAll),
      taskerCostNaira: N(costAll),
      grossMarginNaira: N(marginAll),
      marginPct: revenueAll > 0 ? Math.round((marginAll / revenueAll) * 100) : 0,
    },
    last7d: {
      orders: orders7d,
      revenueNaira: N(revenue7d),
      taskerCostNaira: N(cost7d),
      grossMarginNaira: N(margin7d),
      marginPct: revenue7d > 0 ? Math.round((margin7d / revenue7d) * 100) : 0,
    },
    wallets: {
      outstandingLiabilityNaira: N(walletBalance), // unspent buyer funds we owe
      totalFundedNaira: N(totalFunded),
      totalSpentNaira: N(totalSpent),
      totalRefundedNaira: N(totalRefunded),
    },
    giveaways: {
      cashbackNaira: N(cashback),
      shortfallRefundsNaira: N(shortfall),
      freeRefills: refillCount,
      freeRefillCostNaira: N(refillCostAll),
      promoSpentTodayNaira: N(promoToday),
    },
    fraud: { sharedSignupIps: sharedIps },
  });
}
