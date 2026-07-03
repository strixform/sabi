import { NextRequest, NextResponse } from 'next/server';
import { sabiExecute } from '@/lib/tursoClient';
import { allowOwnerOrStaff } from '@/lib/sabiStaff';

export const maxDuration = 30;
export const preferredRegion = 'sfo1';

/**
 * Double-refund audit + fix.
 *
 * A refund credits the balance AND decrements totalSpent. A double-refund (from the old
 * non-atomic cron) did BOTH an extra time → balance inflated + totalSpent driven NEGATIVE.
 * Negative totalSpent is impossible legitimately, and its magnitude == the exact amount
 * the balance was over-credited. So the fix is precise:
 *     overCredit = -totalSpent ;  balance -= overCredit ;  totalSpent = 0
 *
 * GET  → list affected wallets (dry run, no changes).
 * POST { action:'fix', userId? } → apply the correction (all affected, or one user).
 * Owner only.
 */
export async function GET(req: NextRequest) {
  const auth = await allowOwnerOrStaff(req);
  if (!auth.ok || auth.role !== 'owner') return NextResponse.json({ error: 'Owner only' }, { status: 403 });

  const r = await sabiExecute({
    sql: `SELECT w.userId, u.email, w.balance, w.totalFunded, w.totalSpent
          FROM SabiWallet w LEFT JOIN SabiUser u ON u.id = w.userId
          WHERE w.totalSpent < 0
          ORDER BY w.totalSpent ASC LIMIT 500`,
    args: [],
  }).catch(() => ({ rows: [] as any[] }));

  const affected = (r.rows as any[]).map((x) => {
    const overCreditKobo = -Number(x.totalSpent || 0);
    return {
      userId: String(x.userId),
      email: x.email || null,
      balanceKobo: Number(x.balance || 0),
      totalFundedKobo: Number(x.totalFunded || 0),
      totalSpentKobo: Number(x.totalSpent || 0),
      overCreditKobo,
      correctedBalanceKobo: Math.max(0, Number(x.balance || 0) - overCreditKobo),
    };
  });
  const totalOverCreditKobo = affected.reduce((s, a) => s + a.overCreditKobo, 0);
  return NextResponse.json({
    affectedCount: affected.length,
    totalOverCreditNaira: Math.round(totalOverCreditKobo / 100),
    affected,
  });
}

export async function POST(req: NextRequest) {
  const auth = await allowOwnerOrStaff(req);
  if (!auth.ok || auth.role !== 'owner') return NextResponse.json({ error: 'Owner only' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  if (body?.action !== 'fix') return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  const userId = body.userId ? String(body.userId) : null;

  // Atomic + idempotent: only touches wallets still showing totalSpent < 0. Removes the
  // over-credit from balance and zeroes the negative totalSpent.
  const where = userId ? `userId = ? AND totalSpent < 0` : `totalSpent < 0`;
  const args = userId ? [userId] : [];
  const res = await sabiExecute({
    sql: `UPDATE SabiWallet
          SET balance = MAX(0, balance + totalSpent),  -- totalSpent is negative → subtracts the over-credit
              totalSpent = 0,
              updatedAt = datetime('now')
          WHERE ${where}`,
    args,
  }).catch((e: any) => ({ rowsAffected: 0, error: String(e?.message) } as any));

  return NextResponse.json({ ok: true, fixed: Number((res as any).rowsAffected ?? 0) });
}
