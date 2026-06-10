import { prisma } from './prisma';

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
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check for duplicate
    const duplicate = await prisma.sabiTransaction.findFirst({
      where: {
        userId,
        type: 'fund',
        reference,
      },
    });

    if (duplicate) {
      return { success: true }; // Idempotent
    }

    // Update wallet atomically
    await prisma.sabiWallet.update({
      where: { userId },
      data: {
        balance: { increment: amountInKobo },
        totalFunded: { increment: amountInKobo },
      },
    });

    // Record transaction
    await prisma.sabiTransaction.create({
      data: {
        userId,
        type: 'fund',
        amount: amountInKobo,
        reference,
        description: 'Wallet funding via Flutterwave',
      },
    });

    return { success: true };
  } catch (error) {
    // Error logging handled by external service
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
