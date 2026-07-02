import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'sfo1';

/**
 * Internal cross-app hook: COAST calls this when a support ticket for a SABI order
 * is marked FIXED. We look the order up by ID (or the customer's own ref / txRef),
 * find the customer, and email them that their issue is resolved.
 *
 * Auth: shared secret in the Authorization: Bearer header (COAST_TICKET_SECRET),
 * set on both this project and COAST.
 *
 * Sanitised on purpose — never reveals gamers360/taskers; fulfilment is only ever
 * framed as "our team" / "real people".
 */
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Sabi <noreply@sability.io>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sability.io';

function esc(s: string) {
  return String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] || c));
}

function mask(email: string) {
  const [u, d] = email.split('@');
  if (!d) return '***';
  return (u.length <= 2 ? u[0] + '*' : u.slice(0, 2) + '***') + '@' + d;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const secret = process.env.COAST_TICKET_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const orderId = String(body?.orderId || '').trim();
  const note = String(body?.note || '').trim();
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  const order = await prisma.sabiOrder.findFirst({
    where: { OR: [{ id: orderId }, { customRef: orderId }, { transactionRef: orderId }] },
    include: { user: { select: { email: true, name: true, notifyEmail: true } } },
  });
  if (!order) return NextResponse.json({ ok: true, found: false, emailed: false });

  const email = order.user?.email;
  if (!email || order.user?.notifyEmail === false) {
    return NextResponse.json({ ok: true, found: true, emailed: false, reason: 'no email / opted out' });
  }

  const shortId = order.id.slice(-8).toUpperCase();
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f1f5f9;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:32px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:24px">✅ Your order is sorted</h1>
    </div>
    <div style="padding:32px">
      <p style="font-size:15px;line-height:1.6;color:#e2e8f0;">Hi ${esc(order.user?.name || 'there')},</p>
      <p style="font-size:15px;line-height:1.6;color:#e2e8f0;">Good news — the issue you raised on your order <b>#${esc(shortId)}</b> has been resolved by our team.</p>
      ${note ? `<div style="margin:16px 0;padding:14px 16px;background:#1e293b;border-left:3px solid #3b82f6;border-radius:8px;font-size:14px;line-height:1.6;color:#cbd5e1;">${esc(note)}</div>` : ''}
      <p style="font-size:15px;line-height:1.6;color:#e2e8f0;">You can view the latest status any time from your dashboard.</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${APP_URL}/sabi/orders" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;text-decoration:none;font-weight:800;padding:12px 28px;border-radius:10px;font-size:15px;">View my orders →</a>
      </div>
      <p style="font-size:13px;color:#64748b;">Thanks for your patience — reply to this email if anything still looks off.</p>
    </div>
    <div style="padding:16px 32px;background:#1e293b;text-align:center;font-size:12px;color:#64748b">
      <a href="${APP_URL}/sabi/orders" style="color:#3b82f6;text-decoration:none">My Orders</a>
    </div>
  </div>`;

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true, found: true, emailed: false, dev: true, customer: mask(email) });
  }

  try {
    await resend.emails.send({ from: FROM, to: email, subject: `Your SABI order #${shortId} — issue resolved`, html });
    return NextResponse.json({ ok: true, found: true, emailed: true, customer: mask(email) });
  } catch {
    return NextResponse.json({ ok: true, found: true, emailed: false, reason: 'send failed' });
  }
}
