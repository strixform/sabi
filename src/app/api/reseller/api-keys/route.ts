import { NextRequest, NextResponse } from 'next/server';
import { verifyResellerToken } from '@/lib/resellerAuth';
import { sabiExecute } from '@/lib/tursoClient';
import crypto from 'crypto';

/**
 * Reseller API keys — REAL, persisted (was returning hardcoded mock keys and never storing new
 * ones). Keys are shown once on creation; only a SHA-256 hash is stored. The reseller
 * order-placement API that CONSUMES these keys is a separate, larger build (not yet wired).
 */
function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

let ready = false;
async function ensure() {
  if (ready) return;
  await sabiExecute({
    sql: `CREATE TABLE IF NOT EXISTS ResellerApiKey (
      id TEXT PRIMARY KEY,
      resellerId TEXT NOT NULL,
      name TEXT,
      keyHash TEXT NOT NULL,
      preview TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      lastUsedAt TEXT
    )`, args: [],
  }).catch(() => {});
  ready = true;
}

export async function GET() {
  const payload = await verifyResellerToken();
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensure();
  const r = await sabiExecute({ sql: `SELECT id, name, preview, createdAt, lastUsedAt FROM ResellerApiKey WHERE resellerId = ? ORDER BY createdAt DESC`, args: [payload.resellerId] }).catch(() => ({ rows: [] as any[] }));
  const keys = (r.rows as any[]).map(k => ({ id: String(k.id), name: k.name, key: `sk_live_${k.preview || '••••'}…`, createdAt: k.createdAt, lastUsed: k.lastUsedAt }));
  return NextResponse.json({ success: true, keys });
}

export async function POST(request: NextRequest) {
  const payload = await verifyResellerToken();
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensure();
  const body = await request.json().catch(() => ({} as any));
  if (!body.name) return NextResponse.json({ error: 'API key name is required' }, { status: 400 });

  const id = crypto.randomBytes(8).toString('hex');
  const token = crypto.randomBytes(32).toString('hex');
  const fullKey = `sk_live_${token}`;
  await sabiExecute({
    sql: `INSERT INTO ResellerApiKey (id, resellerId, name, keyHash, preview) VALUES (?, ?, ?, ?, ?)`,
    args: [id, payload.resellerId, String(body.name).slice(0, 60), hashKey(fullKey), token.slice(0, 6)],
  });
  return NextResponse.json({
    success: true,
    message: 'API key created. Save it now — you won\'t see it again!',
    key: { id, name: body.name, key: fullKey, createdAt: new Date() },
  });
}

export async function DELETE(request: NextRequest) {
  const payload = await verifyResellerToken();
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensure();
  const id = new URL(request.url).searchParams.get('id') || (await request.json().catch(() => ({} as any))).id;
  if (!id) return NextResponse.json({ error: 'Key id required' }, { status: 400 });
  await sabiExecute({ sql: `DELETE FROM ResellerApiKey WHERE id = ? AND resellerId = ?`, args: [String(id), payload.resellerId] });
  return NextResponse.json({ success: true });
}
