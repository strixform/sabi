/**
 * SABI Admin — Cancel Order
 * POST /api/sabi/admin/cancel-order  { orderId, reason }
 *
 * Cancels a SABI order and fully refunds the user's wallet.
 * Also cancels the linked gamerz360 campaign (if one exists) so it
 * can never be pushed to taskers after this point.
 *
 * Flow:
 *   1. Verify order exists and is cancellable (not already completed/cancelled)
 *   2. Mark SabiOrder.status = 'cancelled'
 *   3. Refund full amount (totalPrice + platformFee) to user's wallet
 *   4. Log SabiTransaction (type='refund')
 *   5. If order has gamesz360CampaignId → call gamerz360 cancel endpoint
 *      so the campaign is rejected and can never be pushed to taskers
 *   6. Email user: order cancelled + refund confirmed
 *
 * Auth: checkSabiAdmin (session cookie OR x-admin-token header)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Sabi <noreply@sability.io>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sability.io';
const G360_URL = process.env.GAMERZ360_API_URL || 'https://gamerz360.com';

export const preferredRegion = 'sfo1';

const NON_CANCELLABLE = ['completed', 'cancelled'];

export async function POST(req: NextRequest) {
  if (!await checkSabiAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { orderId, reason } = await req.json();
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });
    if (!reason?.trim()) return NextResponse.json({ error: 'reason required' }, { status: 400 });

    // Fetch order + user
    const order = await prisma.sabiOrder.findUnique({
      where: { id: orderId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (NON_CANCELLABLE.includes(order.status)) {
      return NextResponse.json({ error: `Cannot cancel — order is already ${order.status}` }, { status: 400 });
    }

    // Full refund amount = totalPrice + platformFee (what was actually deducted)
    const refundKobo = order.totalPrice + order.platformFee;
    const refundNaira = Math.round(refundKobo / 100);

    // Cancel order
    await prisma.sabiOrder.update({
      where: { id: orderId },
      data: { status: 'cancelled' },
    });

    // Refund wallet
    await prisma.sabiWallet.update({
      where: { userId: order.userId },
      data: {
        balance:        { increment: refundKobo },
        totalSpent:     { decrement: refundKobo },
        totalRefunded:  { increment: refundKobo },
      },
    });

    // Audit transaction
    await prisma.sabiTransaction.create({
      data: {
        userId:      order.userId,
        orderId:     orderId,
        type:        'refund',
        amount:      refundKobo,
        description: `Order cancelled by admin: ${reason}`,
        reference:   `cancel-refund-${Date.now()}`,
      },
    });

    // ── Cancel linked gamerz360 campaign (if not yet pushed) ────────────────
    // This prevents the campaign from ever being pushed to taskers.
    // Only call if the campaign was already submitted to gamerz360.
    let g360Result: string = 'no_campaign';
    if (order.gamesz360CampaignId) {
      try {
        const g360Res = await fetch(`${G360_URL}/api/admin/sabi/cancel-campaign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SABI_INTEGRATION_TOKEN}`,
            'User-Agent': 'SABI-Admin/1.0',
          },
          body: JSON.stringify({
            campaignId: order.gamesz360CampaignId,
            reason: `SABI admin cancelled order ${orderId}: ${reason}`,
          }),
        });
        g360Result = g360Res.ok ? 'cancelled' : `failed_${g360Res.status}`;
      } catch (err: any) {
        g360Result = `error_${err?.message?.slice(0, 50)}`;
      }
    }

    // Email user
    const svcName = order.serviceType.replace(/_/g, ' ');
    await resend.emails.send({
      from: FROM,
      to: order.user.email,
      subject: `Order cancelled — ₦${refundNaira.toLocaleString()} refunded to your wallet`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f1f5f9;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:32px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">🚫 Order Cancelled</h1>
        </div>
        <div style="padding:32px">
          <p>Hi <b>${order.user.name}</b>,</p>
          <p>Your order has been cancelled and a full refund of <b style="color:#4ade80">₦${refundNaira.toLocaleString()}</b> has been returned to your wallet.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <tr><td style="padding:8px;color:#94a3b8">Service</td><td style="padding:8px;color:#f1f5f9">${svcName}</td></tr>
            <tr><td style="padding:8px;color:#94a3b8">Quantity</td><td style="padding:8px;color:#f1f5f9">${order.quantity.toLocaleString()}</td></tr>
            <tr><td style="padding:8px;color:#94a3b8">Refunded</td><td style="padding:8px;color:#4ade80;font-weight:bold">₦${refundNaira.toLocaleString()}</td></tr>
            <tr><td style="padding:8px;color:#94a3b8">Reason</td><td style="padding:8px;color:#94a3b8">${reason}</td></tr>
          </table>
          <p style="color:#94a3b8">Your refund is available immediately in your wallet. You can place a new order at any time.</p>
          <div style="text-align:center;margin-top:24px;display:flex;gap:12px;justify-content:center">
            <a href="${APP_URL}/sabi/wallet" style="background:#1e293b;border:1px solid #334155;color:#f1f5f9;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">View Wallet</a>
            <a href="${APP_URL}/sabi/order" style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Place New Order</a>
          </div>
        </div>
      </div>`,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      orderId,
      status: 'cancelled',
      refundKobo,
      refundNaira,
      g360Result,
      message: `Order cancelled. ₦${refundNaira.toLocaleString()} refunded to ${order.user.name}`,
    });

  } catch (err: any) {
    console.error('[sabi/admin/cancel-order]', err);
    return NextResponse.json({ error: err?.message || 'Cancel failed' }, { status: 500 });
  }
}
