import { prisma } from './prisma';

/**
 * The single choke point for refunding money to a SABI wallet.
 *
 * WHY THIS EXISTS: the process-scheduled and partial-refund crons used to credit
 * the wallet directly (`balance += X, totalSpent -= X`) WITHOUT writing a
 * SabiTransaction row. So when a non-atomic bug double-refunded orders overnight,
 * there was no ledger to replay — the only signature was a weird balance, and we
 * had to reconstruct the truth from totalFunded + order status after the fact.
 *
 * Every refund MUST go through here so it is:
 *   - reflected in the wallet (balance up, net-spend down, totalRefunded stat up), AND
 *   - recorded as a `refund` SabiTransaction (userId, orderId, amount, reason)
 * in ONE atomic $transaction. That makes future refunds auditable in one place and
 * a repeat of the double-refund bug immediately visible in the ledger.
 *
 * IDEMPOTENCY IS THE CALLER'S JOB: this always credits. Callers must gate it behind
 * a winning atomic status transition (e.g. updateMany ... WHERE status='processing'
 * then check count === 1) so it runs exactly once per order. See the crons.
 */
export async function creditSabiRefund(opts: {
  userId: string;
  amountKobo: number;
  orderId?: string | null;
  reason?: string;
  reference?: string | null;
}): Promise<void> {
  const amount = Math.round(opts.amountKobo);
  if (!amount || amount <= 0) return;

  // IDEMPOTENT PER ORDER — a given orderId is refunded at most ONCE, ever. This is the
  // hard stop for the recurring double-refund: even if a cron re-processes an order
  // whose status got reverted (e.g. the gamerz360 webhook flipping 'completed' back to
  // 'executing'), the second refund finds an existing refund row and no-ops. Every
  // caller passes a UNIQUE orderId per intended refund (real order id, or an engagement
  // post id / '<pkg>:unused'), so this never blocks a legitimate distinct refund.
  if (opts.orderId) {
    const existing = await prisma.sabiTransaction.findFirst({
      where: { orderId: opts.orderId, type: 'refund' },
      select: { id: true },
    }).catch(() => null);
    if (existing) return; // already refunded this order — skip
  }

  await prisma.$transaction([
    prisma.sabiWallet.update({
      where: { userId: opts.userId },
      data: {
        balance: { increment: amount },
        totalSpent: { decrement: amount },
        totalRefunded: { increment: amount },
      },
    }),
    prisma.sabiTransaction.create({
      data: {
        userId: opts.userId,
        orderId: opts.orderId ?? null,
        type: 'refund',
        amount,
        reference: opts.reference ?? null,
        description: opts.reason ?? 'Order refund',
      },
    }),
  ]);
}
