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

    // Record transaction
    await prisma.sabiTransaction.create({
      data: {
        userId,
        orderId,
        type: 'spend',
        amount: amountInKobo,
        description: `Order ${orderId}`,
      },
    });

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
    // Idempotency check — prevent double-refund for the same order
    const duplicate = await prisma.sabiTransaction.findFirst({
      where: {
        userId,
        type: 'refund',
        reference: orderId,
      },
    });

    if (duplicate) {
      return { success: true }; // Already refunded — idempotent return
    }

    await prisma.sabiWallet.update({
      where: { userId },
      data: {
        balance: { increment: amountInKobo },
        totalRefunded: { increment: amountInKobo },
      },
    });

    await prisma.sabiTransaction.create({
      data: {
        userId,
        orderId,
        type: 'refund',
        amount: amountInKobo,
        reference: orderId,
        description: `Order ${orderId} refunded: ${reason}`,
      },
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
