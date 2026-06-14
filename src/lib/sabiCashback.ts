import { prisma } from './prisma';
import { sabiExecute } from './tursoClient';

/**
 * Loyalty cashback — buyers earn a small % of each completed order back into
 * their wallet. An idempotent ledger (SabiCashback, keyed by orderId) ensures
 * we never double-credit even if the completion webhook fires twice.
 *
 * Self-creating table — no manual Turso migration needed.
 */

export const CASHBACK_RATE = 0.02;     // 2% of the amount charged
export const CASHBACK_CAP_KOBO = 50000; // max ₦500 per order

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await sabiExecute({
    sql: `CREATE TABLE IF NOT EXISTS SabiCashback (
      orderId TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      amountKobo INTEGER NOT NULL,
      createdAt TEXT NOT NULL
    )`,
    args: [],
  });
  tableReady = true;
}

/**
 * Credit cashback for a completed order. Idempotent: the orderId is the primary
 * key, so a second call is a no-op (the INSERT throws and we bail before crediting).
 * `chargedKobo` = what the buyer actually paid (base + fee − discount).
 */
export async function creditOrderCashback(orderId: string, userId: string, chargedKobo: number): Promise<number> {
  if (chargedKobo <= 0) return 0;
  const amountKobo = Math.min(Math.round(chargedKobo * CASHBACK_RATE), CASHBACK_CAP_KOBO);
  if (amountKobo <= 0) return 0;

  // Respect the daily promo budget (fail-open).
  try {
    const { consumePromoBudget } = await import('./redis');
    const { DAILY_PROMO_BUDGET_KOBO } = await import('./sabiPerks');
    const ok = await consumePromoBudget(amountKobo, DAILY_PROMO_BUDGET_KOBO);
    if (!ok) return 0; // budget exhausted today — skip cashback
  } catch { /* if the check fails, fall through (fail open) */ }

  await ensureTable();

  // Claim the ledger row first — if it already exists this throws and we stop.
  try {
    await sabiExecute({
      sql: `INSERT INTO SabiCashback (orderId, userId, amountKobo, createdAt) VALUES (?, ?, ?, ?)`,
      args: [orderId, userId, amountKobo, new Date().toISOString()],
    });
  } catch {
    return 0; // already credited (PK conflict) or table issue — never double-credit
  }

  try {
    await prisma.sabiWallet.update({
      where: { userId },
      data: { balance: { increment: amountKobo }, totalFunded: { increment: amountKobo } },
    });
  } catch {
    return 0;
  }
  return amountKobo;
}

/** Total cashback a user has earned (for display). */
export async function totalCashback(userId: string): Promise<number> {
  await ensureTable();
  try {
    const r = await sabiExecute({ sql: `SELECT COALESCE(SUM(amountKobo), 0) AS total FROM SabiCashback WHERE userId = ?`, args: [userId] });
    return Number((r.rows[0] as any)?.total ?? 0);
  } catch {
    return 0;
  }
}
