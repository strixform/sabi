import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { createClient } from '@libsql/client';
import { randomUUID } from 'crypto';

function db() {
  let url = (process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || '').trim();
  const auth = (process.env.TURSO_AUTH_TOKEN || '').trim();
  if (url.startsWith('libsql://')) url = url.replace('libsql://', 'https://');
  return createClient({ url, authToken: auth });
}

// POST: save a push subscription
export async function POST(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { endpoint, keys } = await req.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  }

  const client = db();
  // Upsert by endpoint
  const existing = (await client.execute({ sql: `SELECT id FROM SabiPushSubscription WHERE endpoint=?`, args: [endpoint] })).rows[0];
  if (existing) {
    await client.execute({ sql: `UPDATE SabiPushSubscription SET userId=?, p256dh=?, auth=?, updatedAt=datetime('now') WHERE endpoint=?`, args: [session.id, keys.p256dh, keys.auth, endpoint] });
  } else {
    await client.execute({ sql: `INSERT INTO SabiPushSubscription (id,userId,endpoint,p256dh,auth) VALUES (?,?,?,?,?)`, args: [randomUUID(), session.id, endpoint, keys.p256dh, keys.auth] });
  }
  return NextResponse.json({ success: true });
}

// DELETE: remove subscription
export async function DELETE(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { endpoint } = await req.json();
  if (endpoint) {
    await db().execute({ sql: `DELETE FROM SabiPushSubscription WHERE endpoint=? AND userId=?`, args: [endpoint, session.id] });
  }
  return NextResponse.json({ success: true });
}
