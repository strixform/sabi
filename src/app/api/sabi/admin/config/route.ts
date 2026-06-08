/**
 * SABI Admin Config API
 * GET  /api/sabi/admin/config  — fetch current platform config (public read for WhatsApp button)
 * POST /api/sabi/admin/config  — update config (admin only)
 *
 * Config fields:
 *   minOrderQuantity  — minimum order quantity allowed on the order page
 *   maxOrderQuantity  — maximum order quantity allowed on the order page
 *   supportWhatsapp   — WhatsApp support number (no + or spaces, e.g. "2348012345678")
 *                       shown as floating button on every SABI page via WhatsAppButton component
 *
 * The GET is intentionally unauthenticated — the WhatsApp button component
 * calls it on every page to check if a number is configured.
 * The POST requires admin auth via checkSabiAdmin (session or token header).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
export const maxDuration = 15;


// GET — public, used by WhatsAppButton on every /sabi/* page
export async function GET(request: NextRequest) {
  try {
    let config = await prisma.sABIAdminConfig.findFirst();

    // Auto-create default config row if it doesn't exist yet
    if (!config) {
      config = await prisma.sABIAdminConfig.create({
        data: { minOrderQuantity: 5, maxOrderQuantity: 5000 },
      });
    }

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('[SABI CONFIG] GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

// POST — admin only — updates all config fields including supportWhatsapp
export async function POST(request: NextRequest) {
  // Guard: only the admin can change platform config
  if (!await checkSabiAdmin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { minOrderQuantity, maxOrderQuantity, supportWhatsapp } = body;

    if (!minOrderQuantity || !maxOrderQuantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (Number(minOrderQuantity) > Number(maxOrderQuantity)) {
      return NextResponse.json({ error: 'Min quantity cannot be greater than max quantity' }, { status: 400 });
    }

    // Strip everything except digits from WhatsApp number (remove +, spaces, dashes)
    const cleanWhatsapp = supportWhatsapp
      ? String(supportWhatsapp).replace(/[^0-9]/g, '') || null
      : null;

    const existing = await prisma.sABIAdminConfig.findFirst();

    if (!existing) {
      // First-time create — use raw SQL since Prisma client may not have supportWhatsapp
      const newId = `cfg_${Math.random().toString(36).slice(2, 12)}`;
      await prisma.$executeRawUnsafe(
        `INSERT INTO "SABIAdminConfig" (id, minOrderQuantity, maxOrderQuantity, supportWhatsapp, updatedAt, createdAt)
         VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
        newId, Number(minOrderQuantity), Number(maxOrderQuantity), cleanWhatsapp
      );
    } else {
      // Update — raw SQL to include supportWhatsapp which may not be in Prisma client
      await prisma.$executeRawUnsafe(
        `UPDATE "SABIAdminConfig"
         SET minOrderQuantity = ?, maxOrderQuantity = ?, supportWhatsapp = ?, updatedAt = datetime('now')
         WHERE id = ?`,
        Number(minOrderQuantity), Number(maxOrderQuantity), cleanWhatsapp, existing.id
      );
    }

    // Re-fetch to return the updated row
    const updated = await prisma.sABIAdminConfig.findFirst();
    return NextResponse.json({ success: true, config: updated });
  } catch (error) {
    console.error('[SABI CONFIG] POST Error:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
