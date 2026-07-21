import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// TEMPORARY. Adds SabiUser.owletUserId on production Turso, which prisma db
// push cannot reach over libsql. Purely additive: one ADD COLUMN plus a unique
// index. No drops, no writes to existing rows. Delete once it has run.
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const preferredRegion = 'sfo1';

export async function POST(req: NextRequest) {
  const secret = process.env.MIGRATE_SECRET;
  if (!secret || req.headers.get('x-migrate-secret') !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const before = await prisma.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM pragma_table_info('SabiUser')`,
  );
  const had = before.some((c) => c.name === 'owletUserId');

  if (!had) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "SabiUser" ADD COLUMN "owletUserId" TEXT`);
  }
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "SabiUser_owletUserId_key" ON "SabiUser"("owletUserId")`,
  );

  const after = await prisma.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM pragma_table_info('SabiUser')`,
  );
  const users = await prisma.sabiUser.count();

  return NextResponse.json({
    ok: true,
    columnAlreadyExisted: had,
    hasColumnNow: after.some((c) => c.name === 'owletUserId'),
    sabiUsers: users,
  });
}
