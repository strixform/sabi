import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Sabi <noreply@sability.io>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sability.io';

function baseHtml(title: string, body: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f1f5f9;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:32px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:24px">🚀 ${title}</h1>
    </div>
    <div style="padding:32px">${body}</div>
    <div style="padding:16px 32px;background:#1e293b;text-align:center;font-size:12px;color:#64748b">
      <a href="${APP_URL}/sabi/dashboard" style="color:#3b82f6;text-decoration:none">Open Dashboard</a> ·
      <a href="${APP_URL}/sabi/orders" style="color:#3b82f6;text-decoration:none">My Orders</a>
    </div>
  </div>`;
}

export async function sendAdminRefillRequestEmail(orderId: string, serviceName: string, quantity: number, reason: string) {
  const adminEmail = process.env.SABI_ADMIN_EMAIL;
  if (!adminEmail) return;
  try {
    await resend.emails.send({
      from: FROM, to: adminEmail,
      subject: `🔁 Refill request — ${serviceName} ×${quantity}`,
      html: baseHtml('Refill Request', `
        <p>A buyer requested a refill that needs your review:</p>
        <ul>
          <li><b>Order:</b> ${orderId}</li>
          <li><b>Service:</b> ${serviceName.replace(/_/g, ' ')}</li>
          <li><b>Refill quantity:</b> ${quantity.toLocaleString()}</li>
          <li><b>Reason:</b> ${reason || '—'}</li>
        </ul>
        <div style="text-align:center;margin-top:24px">
          <a href="${APP_URL}/sabi/admin/refills" style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Review Refill</a>
        </div>
      `),
    });
  } catch {}
}

export async function sendRefillResolvedEmail(email: string, name: string, orderId: string, approved: boolean, quantity: number, note: string) {
  try {
    await resend.emails.send({
      from: FROM, to: email,
      subject: approved ? `✅ Refill approved — ${quantity} on the way` : `Refill request update`,
      html: baseHtml(approved ? 'Refill Approved' : 'Refill Reviewed', `
        <p>Hi <b>${name}</b>,</p>
        <p>${approved
          ? `Your refill of <b>${quantity.toLocaleString()}</b> has been approved and is now being delivered by our crowd — no charge.`
          : `We reviewed your refill request and couldn't approve it this time.`}</p>
        ${note ? `<p style="color:#94a3b8;font-size:13px">Note: ${note}</p>` : ''}
        <div style="text-align:center;margin-top:24px">
          <a href="${APP_URL}/sabi/orders/${orderId}" style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">View Order</a>
        </div>
      `),
    });
  } catch {}
}

export async function sendOrderStartedEmail(email: string, name: string, orderId: string, serviceName: string, quantity: number) {
  try {
    await resend.emails.send({
      from: FROM, to: email,
      subject: `⚡ Your ${serviceName} order is now running`,
      html: baseHtml('Order Started!', `
        <p>Hi <b>${name}</b>,</p>
        <p>Great news — your order has been assigned to taskers and is now running.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <tr><td style="padding:8px;color:#94a3b8">Service</td><td style="padding:8px;color:#f1f5f9;font-weight:bold">${serviceName}</td></tr>
          <tr><td style="padding:8px;color:#94a3b8">Quantity</td><td style="padding:8px;color:#f1f5f9;font-weight:bold">${quantity.toLocaleString()}</td></tr>
          <tr><td style="padding:8px;color:#94a3b8">Order ID</td><td style="padding:8px;color:#94a3b8;font-size:12px">${orderId}</td></tr>
        </table>
        <p style="color:#94a3b8">You'll receive another email when it's complete. You can track progress in real-time on your dashboard.</p>
        <div style="text-align:center;margin-top:24px">
          <a href="${APP_URL}/sabi/orders/${orderId}" style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Track Order</a>
        </div>
      `),
    });
  } catch {}
}

export async function sendOrderCompletedEmail(email: string, name: string, orderId: string, serviceName: string, quantity: number) {
  try {
    await resend.emails.send({
      from: FROM, to: email,
      subject: `✅ Your ${serviceName} order is complete!`,
      html: baseHtml('Order Complete!', `
        <p>Hi <b>${name}</b>,</p>
        <p style="color:#4ade80;font-size:18px;font-weight:bold">🎉 Your order has been completed successfully!</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <tr><td style="padding:8px;color:#94a3b8">Service</td><td style="padding:8px;color:#f1f5f9;font-weight:bold">${serviceName}</td></tr>
          <tr><td style="padding:8px;color:#94a3b8">Delivered</td><td style="padding:8px;color:#4ade80;font-weight:bold">${quantity.toLocaleString()} ✓</td></tr>
        </table>
        <div style="text-align:center;margin-top:24px;display:flex;gap:12px;justify-content:center">
          <a href="${APP_URL}/sabi/orders/${orderId}" style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">View Order</a>
          <a href="${APP_URL}/sabi/order" style="background:#1e293b;border:1px solid #334155;color:#f1f5f9;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Place New Order</a>
        </div>
      `),
    });
  } catch {}
}

export async function sendOrderFailedEmail(email: string, name: string, orderId: string, serviceName: string) {
  try {
    await resend.emails.send({
      from: FROM, to: email,
      subject: `⚠️ Order update: ${serviceName}`,
      html: baseHtml('Order Update', `
        <p>Hi <b>${name}</b>,</p>
        <p>We ran into an issue with your order and your wallet has been refunded in full.</p>
        <p style="color:#94a3b8">Please try placing the order again. If the problem continues, contact our support team.</p>
        <div style="text-align:center;margin-top:24px">
          <a href="${APP_URL}/sabi/order" style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Try Again</a>
        </div>
      `),
    });
  } catch {}
}

/**
 * Sent immediately when a user places an order — before taskers are assigned.
 * Sets expectations: real people, 5min–24hr delivery, refund guarantee.
 * Fires from sabiOrderEngine.ts after the SabiOrder record is created.
 */
export async function sendOrderPlacedEmail(email: string, name: string, orderId: string, serviceName: string, quantity: number, totalNaira: number) {
  try {
    await resend.emails.send({
      from: FROM, to: email,
      subject: `🎯 Order received — ${serviceName} (${quantity.toLocaleString()})`,
      html: baseHtml('Order Placed!', `
        <p>Hi <b>${name}</b>,</p>
        <p>We've received your order and it's now in queue. Here's what happens next:</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <tr><td style="padding:8px;color:#94a3b8">Service</td><td style="padding:8px;color:#f1f5f9;font-weight:bold">${serviceName}</td></tr>
          <tr><td style="padding:8px;color:#94a3b8">Quantity</td><td style="padding:8px;color:#f1f5f9;font-weight:bold">${quantity.toLocaleString()}</td></tr>
          <tr><td style="padding:8px;color:#94a3b8">Amount paid</td><td style="padding:8px;color:#f1f5f9;font-weight:bold">₦${totalNaira.toLocaleString()}</td></tr>
          <tr><td style="padding:8px;color:#94a3b8">Order ID</td><td style="padding:8px;color:#94a3b8;font-size:12px">${orderId}</td></tr>
        </table>
        <div style="background:#1e293b;border-left:4px solid #3b82f6;padding:16px;border-radius:0 8px 8px 0;margin:20px 0">
          <p style="margin:0 0 8px;font-weight:bold;color:#93c5fd">⏱ Delivery time: 5 minutes – 24 hours</p>
          <p style="margin:0;color:#94a3b8;font-size:14px">Your order is fulfilled by <b>real Nigerian users</b> — not bots. Delivery depends on when they're active. We appreciate your patience.</p>
        </div>
        <p style="color:#94a3b8;font-size:13px">If your order is not completed within 24 hours, you'll receive a <b style="color:#f1f5f9">full refund</b> to your wallet automatically.</p>
        <div style="text-align:center;margin-top:24px">
          <a href="${APP_URL}/sabi/orders/${orderId}" style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Track Order</a>
        </div>
      `),
    });
  } catch {}
}

export async function sendAutoTopupEmail(email: string, name: string, amountNaira: number) {
  try {
    await resend.emails.send({
      from: FROM, to: email,
      subject: `⚡ Your SABI wallet needs a top-up`,
      html: baseHtml('Wallet Top-Up Reminder', `
        <p>Hi <b>${name}</b>,</p>
        <p>Your wallet balance has dropped below your auto top-up threshold. Based on your settings, we recommend funding <b>₦${amountNaira.toLocaleString()}</b> to keep your campaigns running without interruption.</p>
        <div style="text-align:center;margin-top:24px">
          <a href="${APP_URL}/sabi/wallet" style="background:linear-gradient(135deg,#10b981,#06b6d4);color:#000;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Fund Wallet Now</a>
        </div>
        <p style="color:#64748b;font-size:12px;margin-top:16px">To disable this reminder, go to Wallet → Settings → Auto Top-Up.</p>
      `),
    });
  } catch {}
}

export async function sendAutoReorderPausedEmail(email: string, name: string, serviceName: string) {
  try {
    const svc = serviceName.replace(/_/g, ' ');
    await resend.emails.send({
      from: FROM, to: email,
      subject: `⏸️ Your auto-reorder was paused`,
      html: baseHtml('Auto-Reorder Paused', `
        <p>Hi <b>${name}</b>,</p>
        <p>We tried to place your scheduled <b>${svc}</b> auto-reorder, but your wallet balance wasn't enough to cover it — so we've <b>paused</b> it to avoid repeated attempts.</p>
        <p>Top up your wallet and resume the subscription whenever you're ready.</p>
        <div style="text-align:center;margin-top:24px">
          <a href="${APP_URL}/sabi/subscriptions" style="background:linear-gradient(135deg,#f59e0b,#ea580c);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Manage Auto-Reorders</a>
        </div>
      `),
    });
  } catch {}
}

export async function sendReferralRewardEmail(email: string, name: string, rewardNaira: number, type: 'referrer' | 'referee') {
  try {
    const msg = type === 'referrer'
      ? `Someone you referred just placed their first order. As a thank-you, we've added <b>₦${rewardNaira.toLocaleString()}</b> to your wallet!`
      : `Welcome bonus! We've added <b>₦${rewardNaira.toLocaleString()}</b> to your wallet for joining via a referral link.`;
    await resend.emails.send({
      from: FROM, to: email,
      subject: `🎁 You earned ₦${rewardNaira.toLocaleString()} on Sabi!`,
      html: baseHtml('Wallet Credited!', `
        <p>Hi <b>${name}</b>,</p>
        <p>${msg}</p>
        <div style="text-align:center;margin-top:24px">
          <a href="${APP_URL}/sabi/wallet" style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">View Wallet</a>
        </div>
      `),
    });
  } catch {}
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/sabi/reset-password?token=${resetToken}`;

    await resend.emails.send({
      from: 'Sabi <noreply@sability.io>',
      to: email,
      subject: 'Reset Your Sabi Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Reset Your Password</h1>
          </div>

          <div style="background: #f8f9fa; padding: 40px; border-radius: 0 0 12px 12px;">
            <p style="color: #333; font-size: 16px;">Hi ${userName},</p>

            <p style="color: #666; line-height: 1.6; margin: 20px 0;">
              We received a request to reset your Sabi account password. Click the button below to create a new password.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>

            <p style="color: #999; font-size: 14px; margin: 20px 0;">
              Or copy this link: <br/>
              <code style="background: #e8e8e8; padding: 8px 12px; border-radius: 4px; word-break: break-all;">${resetLink}</code>
            </p>

            <p style="color: #666; line-height: 1.6; margin: 20px 0;">
              <strong>Note:</strong> This link expires in 1 hour. If you didn't request this, ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #e8e8e8; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center;">
              © 2026 Sabi | Real Nigerian Engagement<br/>
              sability.io
            </p>
          </div>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

export async function sendVerificationEmail(
  email: string,
  verifyCode: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await resend.emails.send({
      from: 'Sabi <noreply@sability.io>',
      to: email,
      subject: 'Verify Your Sabi Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Verify Your Email</h1>
          </div>

          <div style="background: #f8f9fa; padding: 40px; border-radius: 0 0 12px 12px;">
            <p style="color: #333; font-size: 16px;">Hi ${userName},</p>

            <p style="color: #666; line-height: 1.6; margin: 20px 0;">
              Welcome to Sabi! Use the code below to verify your email address and activate your account.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <div style="background: white; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; display: inline-block; margin-bottom: 16px;">
                <p style="margin: 0; font-size: 32px; font-weight: bold; color: #3b82f6; letter-spacing: 4px;">
                  ${verifyCode}
                </p>
              </div>
              <br/>
              <a href="${APP_URL}/sabi/verify?code=${verifyCode}" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                Or click here to verify →
              </a>
            </div>

            <p style="color: #666; line-height: 1.6; margin: 20px 0;">
              <strong>Note:</strong> This code expires in 24 hours. If you didn't create this account, ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #e8e8e8; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center;">
              © 2026 Sabi | Real Nigerian Engagement<br/>
              sability.io
            </p>
          </div>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

