import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (req.headers.get('x-migrate-secret') !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    await prisma.$executeRaw`ALTER TABLE "SABIAdminConfig" ADD COLUMN "supportWhatsapp" TEXT`;
    return NextResponse.json({ ok: true, added: 'supportWhatsapp' });
  } catch (e: any) {
    // "duplicate column" means it already exists — that's fine
    if (e?.message?.includes('duplicate column') || e?.message?.includes('already exists')) {
      return NextResponse.json({ ok: true, alreadyExists: true });
    }
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
