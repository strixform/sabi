/**
 * SABI Admin — Manual Wallet Refund
 * POST /api/sabi/admin/refund
 *
 * Issues a manual refund to a user's SABI wallet. Used when:
 *   - Payment was taken but order was never created (creation failure)
 *   - Order failed before delivery and automatic refund didn't fire
 *   - Any other disputed charge that needs manual resolution
 *
 * Body:
 *   userId      string  — SabiUser.id
 *   amountKobo  number  — refund amount in kobo (₦1 = 100 kobo)
 *   reason      string  — shown to user in email + stored for audit
 *   orderId     string? — optional: link to a specific order
 *
 * What it does:
 *   1. Adds amountKobo to wallet balance + totalRefunded
 *   2. Creates a SabiTransaction record (type='refund')
 *   3. Sends email to user explaining the refund
 *   4. Returns full audit trail
 *
 * Auth: checkSabiAdmin (session cookie OR x-admin-token header)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
import { sendOrderFailedEmail } from '@/lib/email';

export const preferredRegion = 'sfo1';
export const maxDuration = 15;

export async function POST(req: NextRequest) {
  if (!await checkSabiAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { userId, amountKobo, reason, orderId } = await req.json();

    if (!userId || !amountKobo || !reason) {
      return NextResponse.json({ error: 'userId, amountKobo and reason are required' }, { status: 400 });
    }
    if (Number(amountKobo) <= 0) {
      return NextResponse.json({ error: 'amountKobo must be positive' }, { status: 400 });
    }

    const amount = Number(amountKobo);
    const naira  = Math.round(amount / 100);

    // Fetch user for email notification
    const user = await prisma.sabiUser.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Refund wallet — balance up, net-spend down, totalRefunded up (mirror of a debit,
    // consistent with the crons + cancel-order so a refund never leaves totalSpent inflated).
    await prisma.sabiWallet.upsert({
      where: { userId },
      create: { userId, balance: amount, totalRefunded: amount },
      update: {
        balance:       { increment: amount },
        totalSpent:    { decrement: amount },
        totalRefunded: { increment: amount },
      },
    });

    // Audit transaction record
    await prisma.sabiTransaction.create({
      data: {
        userId,
        orderId:     orderId || null,
        type:        'refund',
        amount,
        description: `Manual refund by admin: ${reason}`,
        reference:   `admin-refund-${Date.now()}`,
      },
    });

    // Notify user by email (reuse order-failed template — explains refund + re-order)
    sendOrderFailedEmail(
      user.email,
      user.name,
      orderId || 'N/A',
      'your recent order',
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      refunded: {
        userId,
        email:      user.email,
        name:       user.name,
        amountKobo: amount,
        naira,
        reason,
        orderId:    orderId || null,
      },
      message: `₦${naira.toLocaleString()} refunded to ${user.name} (${user.email})`,
    });

  } catch (err: any) {
    console.error('[sabi/admin/refund]', err);
    return NextResponse.json({ error: err?.message || 'Refund failed' }, { status: 500 });
  }
}
