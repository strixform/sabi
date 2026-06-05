import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';

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
  const client = db();
  await client.execute(`CREATE TABLE IF NOT EXISTS "SabiPushSubscription" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  await client.execute(`CREATE INDEX IF NOT EXISTS "SabiPushSubscription_userId_idx" ON "SabiPushSubscription"("userId")`);
  await client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS "SabiPushSubscription_endpoint_key" ON "SabiPushSubscription"("endpoint")`);
  const cols = (await client.execute(`PRAGMA table_info("SabiPushSubscription")`)).rows.map((r: any) => r.name);
  return NextResponse.json({ ok: true, cols });
}
