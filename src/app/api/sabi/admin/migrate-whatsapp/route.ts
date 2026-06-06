import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (req.headers.get('x-migrate-secret') !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const log: string[] = [];
  try {
    // Create table if missing
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "SABIAdminConfig" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "minOrderQuantity" INTEGER NOT NULL DEFAULT 5,
      "maxOrderQuantity" INTEGER NOT NULL DEFAULT 5000,
      "supportWhatsapp" TEXT,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedBy" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`;
    log.push('table ensured');

    // Add column if table already existed without it
    try {
      await prisma.$executeRaw`ALTER TABLE "SABIAdminConfig" ADD COLUMN "supportWhatsapp" TEXT`;
      log.push('column added');
    } catch (e: any) {
      if (e?.message?.includes('duplicate') || e?.message?.includes('already exists')) {
        log.push('column already exists');
      } else { throw e; }
    }

    // Ensure at least one config row exists
    const existing = await prisma.sABIAdminConfig.findFirst();
    if (!existing) {
      await prisma.sABIAdminConfig.create({ data: { id: 'default' } });
      log.push('default config row created');
    }

    return NextResponse.json({ ok: true, log });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message, log }, { status: 500 });
  }
}
