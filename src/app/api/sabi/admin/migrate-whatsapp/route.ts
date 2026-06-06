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
  const cols = (await client.execute(`PRAGMA table_info("SABIAdminConfig")`)).rows.map((r: any) => r.name);
  if (!cols.includes('supportWhatsapp')) {
    await client.execute(`ALTER TABLE "SABIAdminConfig" ADD COLUMN "supportWhatsapp" TEXT`);
  }
  return NextResponse.json({ ok: true, cols: [...cols, 'supportWhatsapp'] });
}
