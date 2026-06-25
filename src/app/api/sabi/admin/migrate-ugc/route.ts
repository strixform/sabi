import { NextRequest, NextResponse } from 'next/server';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 20;
export const preferredRegion = 'sfo1';

/**
 * Creates the UGCBooking table (escrow-backed creator bookings). Idempotent.
 * GET /api/sabi/admin/migrate-ugc  (admin only)
 */
export async function GET(req: NextRequest) {
  if (!await checkSabiAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "UGCBooking" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "buyerId" TEXT NOT NULL,
        "creatorId" TEXT NOT NULL,
        "creatorHandle" TEXT,
        "creatorPlatform" TEXT,
        "listedPriceKobo" INTEGER NOT NULL DEFAULT 0,
        "offeredPriceKobo" INTEGER NOT NULL DEFAULT 0,
        "counterPriceKobo" INTEGER,
        "agreedPriceKobo" INTEGER,
        "escrowKobo" INTEGER NOT NULL DEFAULT 0,
        "brandUsername" TEXT,
        "brief" TEXT,
        "status" TEXT NOT NULL DEFAULT 'pending_creator',
        "proofUrl" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_ugcbooking_buyer" ON "UGCBooking" ("buyerId", "createdAt")`).catch(() => {});
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_ugcbooking_creator" ON "UGCBooking" ("creatorId", "status")`).catch(() => {});
    return NextResponse.json({ success: true, status: 'UGCBooking ready' });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 });
  }
}
