/**
 * SABI Admin — Manual Wallet Adjustment (Credit / Debit)
 * POST /api/sabi/admin/wallet-adjust
 *
 * Manually credit or debit a user's SABI wallet.
 *
 * Credit: adds funds (compensation, manual top-up, correction)
 * Debit:  removes funds (error correction, unauthorised balance)
 *
 * Body:
 *   userId     string            — SabiUser.id
 *   type       'credit'|'debit'  — direction of adjustment
 *   amountNaira number           — amount in NAIRA (converted to kobo internally)
 *   reason     string            — shown to user in notification + stored for audit
 *
 * What it does:
 *   1. Adjusts wallet.balance (+/-)
 *   2. Updates totalFunded (credit) or totalSpent (debit) for accurate accounting
 *   3. Creates a SabiTransaction record (type='credit'|'debit') for audit trail
 *   4. Sends in-app style notification via email to the user
 *
 * Auth: checkSabiAdmin (session cookie OR x-admin-token header)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sability.io';
const FROM = 'Sabi <noreply@sability.io>';

export const preferredRegion = 'sfo1';
export const maxDuration = 15;

export async function POST(req: NextRequest) {
  if (!await checkSabiAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { userId, type, amountNaira, reason } = await req.json();

    if (!userId || !type || !amountNaira || !reason) {
      return NextResponse.json({ error: 'userId, type, amountNaira and reason are required' }, { status: 400 });
    }
    if (!['credit', 'debit'].includes(type)) {
      return NextResponse.json({ error: "type must be 'credit' or 'debit'" }, { status: 400 });
    }
    if (Number(amountNaira) <= 0) {
      return NextResponse.json({ error: 'amountNaira must be positive' }, { status: 400 });
    }

    const naira  = Number(amountNaira);
    const kobo   = Math.round(naira * 100); // convert naira → kobo for storage
    const isCredit = type === 'credit';

    // Fetch user
    const user = await prisma.sabiUser.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Fetch current balance first (for debit guard)
    const wallet = await prisma.sabiWallet.findUnique({ where: { userId } });
    if (!isCredit && wallet && wallet.balance < kobo) {
      return NextResponse.json({
        error: `Insufficient balance — user only has ₦${Math.round(wallet.balance / 100).toLocaleString()}, cannot debit ₦${naira.toLocaleString()}`,
      }, { status: 400 });
    }

    // Apply adjustment
    await prisma.sabiWallet.upsert({
      where:  { userId },
      create: {
        userId,
        balance:       isCredit ? kobo : 0,
        totalFunded:   isCredit ? kobo : 0,
        totalSpent:    isCredit ? 0 : kobo,
      },
      update: isCredit
        ? { balance: { increment: kobo }, totalFunded: { increment: kobo } }
        : { balance: { decrement: kobo }, totalSpent:  { increment: kobo } },
    });

    // Audit transaction
    await prisma.sabiTransaction.create({
      data: {
        userId,
        type:        isCredit ? 'credit' : 'debit',
        amount:      kobo,
        description: `Admin ${type}: ${reason}`,
        reference:   `admin-${type}-${Date.now()}`,
      },
    });

    // Email notification to user
    const subject = isCredit
      ? `✅ ₦${naira.toLocaleString()} credited to your SABI wallet`
      : `⚠️ ₦${naira.toLocaleString()} debited from your SABI wallet`;

    const bodyHtml = isCredit
      ? `<p>Hi <b>${user.name}</b>,</p>
         <p>We've added <b style="color:#4ade80">₦${naira.toLocaleString()}</b> to your SABI wallet.</p>
         <p style="color:#94a3b8"><b>Reason:</b> ${reason}</p>
         <p style="color:#94a3b8">Your updated balance is now available to use for new orders.</p>
         <div style="text-align:center;margin-top:24px">
           <a href="${APP_URL}/sabi/wallet" style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">View Wallet</a>
         </div>`
      : `<p>Hi <b>${user.name}</b>,</p>
         <p>An amount of <b style="color:#f87171">₦${naira.toLocaleString()}</b> has been removed from your SABI wallet.</p>
         <p style="color:#94a3b8"><b>Reason:</b> ${reason}</p>
         <p style="color:#94a3b8">If you have questions, please contact support.</p>
         <div style="text-align:center;margin-top:24px">
           <a href="${APP_URL}/sabi/wallet" style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">View Wallet</a>
         </div>`;

    await resend.emails.send({
      from: FROM,
      to: user.email,
      subject,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f1f5f9;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:32px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">${isCredit ? '💰 Wallet Credited' : '📤 Wallet Adjusted'}</h1>
        </div>
        <div style="padding:32px">${bodyHtml}</div>
        <div style="padding:16px 32px;background:#1e293b;text-align:center;font-size:12px;color:#64748b">
          <a href="${APP_URL}/sabi/dashboard" style="color:#3b82f6;text-decoration:none">Open Dashboard</a>
        </div>
      </div>`,
    }).catch(() => {}); // non-blocking

    return NextResponse.json({
      success: true,
      adjustment: { userId, email: user.email, name: user.name, type, naira, kobo, reason },
      message: `₦${naira.toLocaleString()} ${type}ed to ${user.name} (${user.email}) — email sent`,
    });

  } catch (err: any) {
    console.error('[sabi/admin/wallet-adjust]', err);
    return NextResponse.json({ error: err?.message || 'Adjustment failed' }, { status: 500 });
  }
}
