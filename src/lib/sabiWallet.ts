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

    // 1. Ensure the wallet row exists (updatedAt has no DB default — must supply it).
    await sabiExecute({
      sql: `INSERT OR IGNORE INTO SabiWallet (id, userId, balance, totalFunded, totalSpent, totalRefunded, updatedAt)
            VALUES (?, ?, 0, 0, 0, 0, datetime('now'))`,
      args: [crypto.randomUUID(), userId],
    });

    // 2. ATOMIC IDEMPOTENCY CLAIM — record the funding transaction FIRST, but only if this
    //    (user, fund, reference) isn't already recorded. It's a single INSERT..WHERE NOT
    //    EXISTS, and libsql/Turso serialises writes, so two concurrent callbacks (the FLW
    //    webhook + the client "recheck"/requery) for the SAME reference can't both claim it.
    //    The credit runs ONLY on a successful claim, so a race can NEVER double-credit.
    //    (Previously the dup CHECK and the credit were separate read/writes → a concurrent
    //    pair could both pass the check and credit twice; and the credit ran BEFORE the
    //    record, so a partial failure could double-credit on retry. Recording first, as a
    //    conditional write, fixes both — the money-path lesson from this portfolio.)
    const claim = await sabiExecute({
      sql: `INSERT INTO SabiTransaction (id, userId, type, amount, reference, description, createdAt)
            SELECT ?, ?, 'fund', ?, ?, 'Wallet funding via Flutterwave', datetime('now')
            WHERE NOT EXISTS (SELECT 1 FROM SabiTransaction WHERE userId = ? AND type = 'fund' AND reference = ?)`,
      args: [crypto.randomUUID(), userId, amountInKobo, reference, userId, reference],
    });
    if (!claim.rowsAffected) {
      // Already credited for this reference — return the current balance, credit nothing.
      const w = await sabiExecute({ sql: `SELECT balance FROM SabiWallet WHERE userId = ? LIMIT 1`, args: [userId] }).catch(() => null);
      return { success: true, balance: Number((w?.rows[0] as any)?.balance ?? 0) };
    }

    // 3. We own the claim → credit atomically and read back the new balance.
    const upd = await sabiExecute({
      sql: `UPDATE SabiWallet SET balance = balance + ?, totalFunded = totalFunded + ?, updatedAt = datetime('now')
            WHERE userId = ? RETURNING balance`,
      args: [amountInKobo, amountInKobo, userId],
    });
    const newBalance = Number((upd.rows[0] as any)?.balance ?? 0);

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

    // ATOMIC IDEMPOTENCY CLAIM — record the refund FIRST, but only if this (user, refund,
    // orderId) isn't already recorded. Single INSERT..WHERE NOT EXISTS + serialised writes
    // means a concurrent double-refund (the inline refund racing the reconcile cron) can't
    // both claim it; the credit runs ONLY on a successful claim, so it can never double-refund.
    // (Same conditional-write fix as creditSabiWallet — replaces the old check-then-write.)
    const claim = await sabiExecute({
      sql: `INSERT INTO SabiTransaction (id, userId, orderId, type, amount, reference, description, createdAt)
            SELECT ?, ?, ?, 'refund', ?, ?, ?, datetime('now')
            WHERE NOT EXISTS (SELECT 1 FROM SabiTransaction WHERE userId = ? AND type = 'refund' AND reference = ?)`,
      args: [crypto.randomUUID(), userId, orderId || null, amountInKobo, orderId, `Order ${orderId} refunded: ${reason}`, userId, orderId],
    });
    if (!claim.rowsAffected) {
      return { success: true }; // Already refunded — idempotent return
    }

    // We own the claim → balance up, net-spend down (clamped at 0 — a refund must never
    // drive totalSpent negative, the double-refund signature), totalRefunded up. Consistent
    // with the crons + cancel-order so a refund never leaves totalSpent inflated.
    await sabiExecute({
      sql: `UPDATE SabiWallet SET balance = balance + ?, totalSpent = MAX(0, totalSpent - ?), totalRefunded = totalRefunded + ?, updatedAt = datetime('now')
            WHERE userId = ?`,
      args: [amountInKobo, amountInKobo, amountInKobo, userId],
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
  const { verifyFlwTransaction, listFlwTransactionsByEmail } = await import('./sabiFlutterwave');
  const ownerPrefix = `sabi_${userId.substring(0, 8)}_`;

  // The user's email — needed to sweep card top-ups AND dedicated-account transfers
  // straight from Flutterwave (not just refs we happened to record).
  let email = '';
  try { const u = await prisma.sabiUser.findUnique({ where: { id: userId }, select: { email: true } }); email = u?.email || ''; } catch { /* no email */ }

  let refs: string[] = [];
  try {
    const r = await sabiExecute({
      sql: `SELECT reference FROM SabiTransaction WHERE userId = ? AND type = 'fund_pending' AND reference IS NOT NULL AND createdAt > datetime('now','-4 days') ORDER BY createdAt DESC LIMIT 15`,
      args: [userId],
    });
    refs = (r.rows as any[]).map(row => String(row.reference)).filter(Boolean).filter(x => x.startsWith(ownerPrefix)).slice(0, 15);
  } catch { /* none */ }

  let newBalanceKobo: number | null = null; let succeeded = 0;
  const done = new Set<string>();

  // 1) Known pending refs.
  for (const ref of refs) {
    try {
      const v = await verifyFlwTransaction(ref);
      if (!v.success || v.status !== 'successful') continue;
      if (v.txRef && !v.txRef.startsWith(ownerPrefix)) continue;
      const kobo = Math.round((v.amount || 0) * 100);
      if (kobo <= 0) continue;
      succeeded++; done.add(ref);
      const cr = await creditSabiWallet(userId, kobo, v.txRef || ref);
      if (cr.success && typeof cr.balance === 'number') newBalanceKobo = cr.balance;
    } catch { /* skip */ }
  }

  // 2) CARD top-ups by email — catches a paid card top-up with no recorded ref.
  if (email) {
    try {
      const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const txs = await listFlwTransactionsByEmail(email, from).catch(() => [] as any[]);
      const emailLc = email.toLowerCase();
      for (const tx of txs) {
        if (tx?.status !== 'successful' || (tx?.currency || 'NGN') !== 'NGN') continue;
        const ref = String(tx?.tx_ref || '');
        if (!ref.startsWith(ownerPrefix)) continue;
        if (String(tx?.customer?.email || '').toLowerCase() !== emailLc) continue;
        if (done.has(ref)) continue; done.add(ref);
        const kobo = Math.round(Number(tx?.amount || 0) * 100);
        if (kobo <= 0) continue;
        succeeded++;
        const cr = await creditSabiWallet(userId, kobo, ref);
        if (cr.success && typeof cr.balance === 'number') newBalanceKobo = cr.balance;
      }
    } catch { /* best-effort */ }
  }

  // 3) DEDICATED-ACCOUNT (bank transfer) inflows — the VA path the card check misses.
  if (email) {
    try {
      const { reconcileVirtualAccount } = await import('./sabiVirtualAccount');
      const va = await reconcileVirtualAccount(userId, email);
      if (va.credited > 0) {
        succeeded += va.credited;
        const w = await getSabiWallet(userId);
        if (w && typeof w.balance === 'number') newBalanceKobo = w.balance;
      }
    } catch { /* best-effort */ }
  }

  return {
    found: succeeded,
    newBalanceNaira: newBalanceKobo != null ? Math.round(newBalanceKobo / 100) : null,
    summary: succeeded > 0
      ? `${succeeded} successful payment(s) verified and the wallet is up to date${newBalanceKobo != null ? ` (balance ₦${Math.round(newBalanceKobo / 100).toLocaleString()})` : ''}. Tell the customer it's now credited.`
      : `Checked the customer's recent card top-ups AND dedicated-account transfers; NONE have succeeded at Flutterwave yet. Do NOT promise a credit — if they insist they were debited, ask for the receipt and escalate.`,
  };
}
