import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// TEMPORARY, secret-guarded migration endpoint.
// Adds (additively, idempotently) the targeting/comment columns on SabiOrder
// and the SabiFavorite table. Remove after running.

function db() {
  let url = (process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || '').trim();
  const authToken = (process.env.TURSO_AUTH_TOKEN || '').trim();
  if (url.startsWith('libsql://')) url = url.replace('libsql://', 'https://');
  return createClient({ url, authToken });
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-migrate-secret') !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const dryRun = req.nextUrl.searchParams.get('dryRun') === '1';

  const client = db();
  const log: string[] = [];

  // Existing SabiOrder columns
  const existing = (await client.execute(`PRAGMA table_info("SabiOrder")`)).rows.map((r: any) => r.name);

  const addCols = [
    { name: 'audienceGender',      ddl: `ALTER TABLE "SabiOrder" ADD COLUMN "audienceGender" TEXT` },
    { name: 'audienceLocation',    ddl: `ALTER TABLE "SabiOrder" ADD COLUMN "audienceLocation" TEXT` },
    { name: 'commentGender',       ddl: `ALTER TABLE "SabiOrder" ADD COLUMN "commentGender" TEXT` },
    { name: 'commentInstructions', ddl: `ALTER TABLE "SabiOrder" ADD COLUMN "commentInstructions" TEXT` },
  ];
  const todo = addCols.filter((c) => !existing.includes(c.name));
  log.push(`SabiOrder existing cols: ${existing.length}; to add: ${todo.map((c) => c.name).join(', ') || '(none)'}`);

  const tableDDL = [
    `CREATE TABLE IF NOT EXISTS "SabiFavorite" (
       "id" TEXT PRIMARY KEY NOT NULL,
       "userId" TEXT NOT NULL,
       "serviceId" TEXT NOT NULL,
       "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "SabiFavorite_userId_serviceId_key" ON "SabiFavorite"("userId","serviceId")`,
    `CREATE INDEX IF NOT EXISTS "SabiFavorite_userId_idx" ON "SabiFavorite"("userId")`,
  ];

  if (dryRun) {
    return NextResponse.json({ dryRun: true, willAddColumns: todo.map((c) => c.name), willEnsureTable: 'SabiFavorite', log });
  }

  for (const c of todo) {
    await client.execute(c.ddl);
    log.push(`added column ${c.name}`);
  }
  for (const ddl of tableDDL) {
    await client.execute(ddl);
  }
  log.push('ensured SabiFavorite table + indexes');

  // Verify
  const after = (await client.execute(`PRAGMA table_info("SabiOrder")`)).rows.map((r: any) => r.name);
  const favCols = (await client.execute(`PRAGMA table_info("SabiFavorite")`)).rows.map((r: any) => r.name);
  const need = ['audienceGender', 'audienceLocation', 'commentGender', 'commentInstructions'];
  return NextResponse.json({
    ok: true,
    sabiOrderHasAll: need.every((n) => after.includes(n)),
    sabiFavoriteCols: favCols,
    log,
  });
}
