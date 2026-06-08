/**
 * SABI — Submit Custom Order Request
 * POST /api/sabi/orders/custom
 *
 * Accepts a brief from a user or anonymous visitor describing a custom
 * digital action they want the SABI tasker network to perform.
 * Does NOT auto-deduct wallet — it's a request/quote flow, not a live order.
 *
 * Flow:
 *   1. Validate required fields
 *   2. Create SabiCustomRequest row (status = 'new')
 *   3. Notify admin via email
 *   4. Return success with reference ID
 *
 * Auth: optional — logged-in users get their userId attached for context.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSabiSession } from '@/lib/sabiAuth';

export const preferredRegion = 'sfo1';
export const maxDuration = 20;

const VALID_CATEGORIES = [
  'social_growth', 'app_reviews', 'website_traffic',
  'community', 'content_amp', 'business', 'voting', 'other',
] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, email, whatsapp, category, description,
      targetPlatform, targetUrl, quantity, budget, timeline,
    } = body;

    // Validate required fields
    if (!name?.trim())        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!email?.trim())       return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    if (!whatsapp?.trim())    return NextResponse.json({ error: 'WhatsApp number is required' }, { status: 400 });
    if (!description?.trim()) return NextResponse.json({ error: 'Please describe what you need' }, { status: 400 });
    if (!VALID_CATEGORIES.includes(category)) return NextResponse.json({ error: 'Invalid category' }, { status: 400 });

    // Email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // WhatsApp — digits only after stripping common prefixes
    const cleanWa = whatsapp.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');
    if (!/^\d{7,15}$/.test(cleanWa)) {
      return NextResponse.json({ error: 'Enter a valid WhatsApp number (digits only, 7-15 chars)' }, { status: 400 });
    }

    // If user is logged in, attach their ID (not required — open to anyone)
    let userId: string | null = null;
    try {
      const session = await getSabiSession();
      if (session) userId = session.id;
    } catch { /* not logged in — fine */ }

    const request = await prisma.sabiCustomRequest.create({
      data: {
        userId:         userId ?? undefined,
        name:           name.trim(),
        email:          email.trim().toLowerCase(),
        whatsapp:       cleanWa,
        category,
        description:    description.trim(),
        targetPlatform: targetPlatform?.trim() || null,
        targetUrl:      targetUrl?.trim() || null,
        quantity:       quantity ? parseInt(String(quantity)) : null,
        budget:         budget?.trim() || null,
        timeline:       timeline?.trim() || null,
        status:         'new',
      },
    });

    // Fire-and-forget admin email notification
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      resend.emails.send({
        from: 'Sabi <noreply@sability.io>',
        to: process.env.ADMIN_EMAIL || 'olusehinde09@gmail.com',
        subject: `🆕 Custom Order Request — ${name} (${category.replace('_', ' ')})`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;background:#0f172a;color:#f1f5f9;border-radius:12px;overflow:hidden">
            <div style="background:linear-gradient(135deg,#7c3aed,#3b82f6);padding:24px 32px">
              <h1 style="color:#fff;margin:0;font-size:20px">🆕 New Custom Order Request</h1>
              <p style="color:#e2e8f0;margin:4px 0 0">Submitted via sability.io</p>
            </div>
            <div style="padding:32px">
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Name</td><td style="padding:8px 0;color:#f1f5f9;font-weight:bold">${name}</td></tr>
                <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Email</td><td style="padding:8px 0;color:#38bdf8">${email}</td></tr>
                <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">WhatsApp</td><td style="padding:8px 0;color:#4ade80">+${cleanWa}</td></tr>
                <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Category</td><td style="padding:8px 0;color:#a78bfa">${category.replace(/_/g, ' ')}</td></tr>
                <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Platform</td><td style="padding:8px 0;color:#f1f5f9">${targetPlatform || '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Budget</td><td style="padding:8px 0;color:#f1f5f9">${budget || '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Timeline</td><td style="padding:8px 0;color:#f1f5f9">${timeline || '—'}</td></tr>
              </table>
              <div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:16px;margin:16px 0">
                <div style="color:#94a3b8;font-size:12px;margin-bottom:8px">DESCRIPTION</div>
                <div style="color:#f1f5f9;font-size:14px;line-height:1.6">${description}</div>
              </div>
              <a href="https://sability.io/sabi/admin" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#3b82f6);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px">
                View in Admin → Requests
              </a>
            </div>
          </div>`,
      }).catch(() => {});
    } catch { /* non-fatal */ }

    return NextResponse.json({
      success: true,
      requestId: request.id,
      message: 'Your request has been received! We will reach out within 24 hours via WhatsApp or email.',
    });
  } catch (err: any) {
    console.error('[sabi/orders/custom]', err?.message);
    return NextResponse.json({ error: 'Failed to submit request — please try again' }, { status: 500 });
  }
}
