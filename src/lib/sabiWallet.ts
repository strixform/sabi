import { prisma } from './prisma';
import { sabiExecute } from './tursoClient';
import crypto from 'crypto';

export interface WalletData {
  balance: number;
  totalFunded: number;
  totalSpent: number;
  totalRefunded: number;
}

// Get wallet balance
export async function getSabiWallet(userId: string): Promise<WalletData | null> {
  try {
    const wallet = await prisma.sabiWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      return null;
    }

    return {
      balance: wallet.balance,
      totalFunded: wallet.totalFunded,
      totalSpent: wallet.totalSpent,
      totalRefunded: wallet.totalRefunded,
    };
  } catch (error) {
    // Error logging handled by external service
    return null;
  }
}

// Add funds to wallet (after Flutterwave payment confirmed)
export async function creditSabiWallet(
  userId: string,
  amountInKobo: number,
  reference: string
): Promise<{ success: boolean; error?: string; balance?: number }> {
  try {
    // DIRECT libsql (sabiExecute) — NOT Prisma. Prisma's libsql adapter has 10-80s
    // cold starts on Vercel; the payment callback (maxDuration 15) timed out before
    // the credit completed, so paid funds never reflected. sabiExecute is raw HTTP
    // with 429-retry backoff. Same fix as SABI login.

    // 1. Idempotency — skip if this reference was already credited as a fund.
    const dup = await sabiExecute({
      sql: `SELECT id FROM SabiTransaction WHERE userId = ? AND type = 'fund' AND reference = ? LIMIT 1`,
      args: [userId, reference],
    });
    if (dup.rows.length > 0) {
      const w = await sabiExecute({ sql: `SELECT balance FROM SabiWallet WHERE userId = ? LIMIT 1`, args: [userId] }).catch(() => null);
      return { success: true, balance: Number((w?.rows[0] as any)?.balance ?? 0) };
    }

    // 2. Ensure the wallet row exists (updatedAt has no DB default — must supply it).
    await sabiExecute({
      sql: `INSERT OR IGNORE INTO SabiWallet (id, userId, balance, totalFunded, totalSpent, totalRefunded, updatedAt)
            VALUES (?, ?, 0, 0, 0, 0, datetime('now'))`,
      args: [crypto.randomUUID(), userId],
    });

    // 3. Credit atomically and read back the new balance.
    const upd = await sabiExecute({
      sql: `UPDATE SabiWallet SET balance = balance + ?, totalFunded = totalFunded + ?, updatedAt = datetime('now')
            WHERE userId = ? RETURNING balance`,
      args: [amountInKobo, amountInKobo, userId],
    });
    const newBalance = Number((upd.rows[0] as any)?.balance ?? 0);

    // 4. Record the funding transaction (id + createdAt supplied — no Prisma defaults in raw SQL).
    await sabiExecute({
      sql: `INSERT INTO SabiTransaction (id, userId, type, amount, reference, description, createdAt)
            VALUES (?, ?, 'fund', ?, ?, 'Wallet funding via Flutterwave', datetime('now'))`,
      args: [crypto.randomUUID(), userId, amountInKobo, reference],
    });

    return { success: true, balance: newBalance };
  } catch (error) {
    return { success: false, error: 'Failed to credit wallet' };
  }
}

// Debit wallet for order placement (atomic with guard)
export async function debitSabiWallet(
  userId: string,
  amountInKobo: number,
  orderId: string
): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const result = await prisma.$executeRaw`
      UPDATE SabiWallet
      SET balance = balance - ${amountInKobo},
          totalSpent = totalSpent + ${amountInKobo},
          updatedAt = CURRENT_TIMESTAMP
      WHERE userId = ${userId} AND balance >= ${amountInKobo}
      RETURNING balance
    `;

    if (!result || result === 0) {
      const wallet = await prisma.sabiWallet.findUnique({ where: { userId } });
      return {
        success: false,
        error: 'Insufficient balance',
        balance: wallet?.balance || 0,
      };
    }

    // The balance has ALREADY moved above. The transaction log is best-effort:
    // if it fails we must NOT report failure — doing so makes the caller skip the
    // refund while the money is already gone (the charged-without-order bug).
    // Raw insert for resilience (Prisma cold-starts can time out on Turso).
    try {
      await sabiExecute({
        sql: `INSERT INTO SabiTransaction (id, userId, orderId, type, amount, description, createdAt)
              VALUES (?, ?, ?, 'spend', ?, ?, datetime('now'))`,
        args: [crypto.randomUUID(), userId, orderId || null, amountInKobo, `Order ${orderId || ''}`.trim()],
      });
    } catch (logErr: any) {
      console.error('[debitSabiWallet] balance debited but tx-log failed (non-fatal):', logErr?.message);
    }

    return { success: true };
  } catch (error) {
    // Error logging handled by external service
    return { success: false, error: 'Failed to process order' };
  }
}

// Refund wallet (for cancelled/failed orders)
export async function refundSabiWallet(
  userId: string,
  amountInKobo: number,
  orderId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // RAW (sabiExecute) throughout — Prisma's libsql adapter cold-starts can time
    // out on Vercel, which is exactly when a refund matters most (the order create
    // just failed for the same reason). Raw HTTP with 429-retry is the resilient path.

    // Idempotency — prevent double-refund for the same reference (orderId).
    const duplicate = await sabiExecute({
      sql: `SELECT id FROM SabiTransaction WHERE userId = ? AND type = 'refund' AND reference = ? LIMIT 1`,
      args: [userId, orderId],
    });
    if (duplicate.rows.length > 0) {
      return { success: true }; // Already refunded — idempotent return
    }

    // balance up, net-spend down (clamped at 0 — a refund must never drive totalSpent
    // negative, which was the double-refund signature), totalRefunded up. Consistent
    // with the crons + cancel-order so a refund never leaves totalSpent inflated.
    await sabiExecute({
      sql: `UPDATE SabiWallet SET balance = balance + ?, totalSpent = MAX(0, totalSpent - ?), totalRefunded = totalRefunded + ?, updatedAt = datetime('now')
            WHERE userId = ?`,
      args: [amountInKobo, amountInKobo, amountInKobo, userId],
    });

    await sabiExecute({
      sql: `INSERT INTO SabiTransaction (id, userId, orderId, type, amount, reference, description, createdAt)
            VALUES (?, ?, ?, 'refund', ?, ?, ?, datetime('now'))`,
      args: [crypto.randomUUID(), userId, orderId || null, amountInKobo, orderId, `Order ${orderId} refunded: ${reason}`],
    });

    return { success: true };
  } catch (error) {
    // Error logging handled by external service
    return { success: false, error: 'Refund failed' };
  }
}

// Get transaction history
export async function getSabiTransactions(userId: string, limit: number = 50) {
  try {
    return await prisma.sabiTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (error) {
    // Error logging handled by external service
    return [];
  }
}

/**
 * Re-verify a user's recent pending payments directly with Flutterwave and credit any that
 * genuinely succeeded (creditSabiWallet is idempotent → never double-credits). Shared by the
 * self-service /wallet/requery route AND the AI support agent (so it answers payment
 * questions from the live truth, not a guess). Returns a short summary for the AI.
 */
export async function recheckUserPayments(userId: string): Promise<{ found: number; newBalanceNaira: number | null; summary: string }> {
  const { verifyFlwTransaction } = await import('./sabiFlutterwave');
  const ownerPrefix = `sabi_${userId.substring(0, 8)}_`;
  let refs: string[] = [];
  try {
    const r = await sabiExecute({
      sql: `SELECT reference FROM SabiTransaction WHERE userId = ? AND type = 'fund_pending' AND reference IS NOT NULL AND createdAt > datetime('now','-4 days') ORDER BY createdAt DESC LIMIT 15`,
      args: [userId],
    });
    refs = (r.rows as any[]).map(row => String(row.reference)).filter(Boolean).filter(x => x.startsWith(ownerPrefix)).slice(0, 15);
  } catch { /* none */ }
  if (refs.length === 0) return { found: 0, newBalanceNaira: null, summary: 'No recent (last 4 days) funding attempt on record to re-check.' };

  let newBalanceKobo: number | null = null; let succeeded = 0;
  for (const ref of refs) {
    try {
      const v = await verifyFlwTransaction(ref);
      if (!v.success || v.status !== 'successful') continue;
      if (v.txRef && !v.txRef.startsWith(ownerPrefix)) continue;
      const kobo = Math.round((v.amount || 0) * 100);
      if (kobo <= 0) continue;
      succeeded++;
      const cr = await creditSabiWallet(userId, kobo, v.txRef || ref);
      if (cr.success && typeof cr.balance === 'number') newBalanceKobo = cr.balance;
    } catch { /* skip */ }
  }
  return {
    found: succeeded,
    newBalanceNaira: newBalanceKobo != null ? Math.round(newBalanceKobo / 100) : null,
    summary: succeeded > 0
      ? `${succeeded} successful payment(s) verified and the wallet is up to date${newBalanceKobo != null ? ` (balance ₦${Math.round(newBalanceKobo / 100).toLocaleString()})` : ''}. Tell the customer it's now credited.`
      : `Checked ${refs.length} recent funding attempt(s); NONE have succeeded at Flutterwave yet. Do NOT promise a credit — if they insist they were debited, ask for the receipt and escalate.`,
  };
}
