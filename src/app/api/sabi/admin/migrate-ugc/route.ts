import { NextRequest, NextResponse } from 'next/server';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 60;
export const preferredRegion = 'sfo1';

/**
 * Creates the UGCBooking table (escrow-backed creator bookings). Idempotent.
 * Each statement runs independently with retries so a Turso abort/slow-DDL under
 * load doesn't 504 the whole thing; re-running always safe. GET (admin only).
 */
export async function GET(req: NextRequest) {
  if (!await checkSabiAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  async function run(label: string, sql: string) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try { await prisma.$executeRawUnsafe(sql); return { label, status: 'OK' }; }
      catch (e: any) {
        const msg = String(e?.message || e).toLowerCase();
        if (msg.includes('already exists') || msg.includes('duplicate')) return { label, status: 'ALREADY_EXISTS' };
        if (attempt === 3) return { label, status: `ERROR: ${e?.message || e}` };
        await new Promise(r => setTimeout(r, 500 * attempt));
      }
    }
    return { label, status: 'ERROR' };
  }

  const results = [];
  results.push(await run('table', `CREATE TABLE IF NOT EXISTS "UGCBooking" (
      "id" TEXT NOT NULL PRIMARY KEY, "buyerId" TEXT NOT NULL, "creatorId" TEXT NOT NULL,
      "creatorHandle" TEXT, "creatorPlatform" TEXT, "listedPriceKobo" INTEGER NOT NULL DEFAULT 0,
      "offeredPriceKobo" INTEGER NOT NULL DEFAULT 0, "counterPriceKobo" INTEGER, "agreedPriceKobo" INTEGER,
      "escrowKobo" INTEGER NOT NULL DEFAULT 0, "brandUsername" TEXT, "brief" TEXT,
      "status" TEXT NOT NULL DEFAULT 'pending_creator', "proofUrl" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`));
  results.push(await run('idx_buyer', `CREATE INDEX IF NOT EXISTS "idx_ugcbooking_buyer" ON "UGCBooking" ("buyerId", "createdAt")`));
  results.push(await run('idx_creator', `CREATE INDEX IF NOT EXISTS "idx_ugcbooking_creator" ON "UGCBooking" ("creatorId", "status")`));

  const ok = results.every(r => r.status === 'OK' || r.status === 'ALREADY_EXISTS');
  return NextResponse.json({ success: ok, results, note: ok ? 'UGCBooking ready' : 'Some statements failed — re-run to finish.' });
}
