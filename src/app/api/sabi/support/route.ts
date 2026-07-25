import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { sabiExecute } from '@/lib/tursoClient';
import { ensureSupportTables, postSupportMessage, aiAutoReply } from '@/lib/sabiSupportAI';
import crypto from 'crypto';

export const preferredRegion = 'sfo1';
export const maxDuration = 20;

/**
 * Customer support tickets (replaces WhatsApp). The AI answers instantly on the next poll.
 * GET  → the caller's conversations (list) or ?conversationId= for one thread.
 * POST { conversationId?, subject?, body } → send a message (creates a ticket if new).
 */
export async function GET(req: NextRequest) {
  const s = await getSabiSession();
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensureSupportTables();
  const convId = req.nextUrl.searchParams.get('conversationId');

  if (convId) {
    const conv = (await sabiExecute({ sql: `SELECT id, subject, status, needsHuman FROM SabiSupportConversation WHERE id = ? AND userId = ? LIMIT 1`, args: [convId, s.id] })).rows[0] as any;
    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const messages = (await sabiExecute({ sql: `SELECT id, authorName, fromAdmin, body, createdAt FROM SabiSupportMessage WHERE conversationId = ? AND internal = 0 ORDER BY createdAt ASC LIMIT 200`, args: [convId] })).rows as any[];
    return NextResponse.json({ conversation: { id: conv.id, subject: conv.subject, status: conv.status, needsHuman: Number(conv.needsHuman) === 1 }, messages });
  }

  const rows = (await sabiExecute({
    sql: `SELECT c.id, c.subject, c.status, c.needsHuman, c.updatedAt,
                 (SELECT body FROM SabiSupportMessage m WHERE m.conversationId = c.id AND m.internal = 0 ORDER BY m.createdAt DESC LIMIT 1) AS lastMessage
          FROM SabiSupportConversation c WHERE c.userId = ? ORDER BY c.updatedAt DESC LIMIT 50`,
    args: [s.id],
  }).catch(() => ({ rows: [] as any[] }))).rows as any[];
  return NextResponse.json({ conversations: rows.map(r => ({ id: r.id, subject: r.subject, status: r.status, needsHuman: Number(r.needsHuman) === 1, lastMessage: r.lastMessage, updatedAt: r.updatedAt })) });
}

export async function POST(req: NextRequest) {
  const s = await getSabiSession();
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensureSupportTables();
  const body = await req.json().catch(() => ({}));
  const text = String(body.body || '').trim();
  if (!text) return NextResponse.json({ error: 'Type a message first.' }, { status: 400 });

  let convId = String(body.conversationId || '').trim();
  if (convId) {
    const owns = (await sabiExecute({ sql: `SELECT id, status FROM SabiSupportConversation WHERE id = ? AND userId = ? LIMIT 1`, args: [convId, s.id] })).rows[0] as any;
    if (!owns) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    // A new customer message reopens a resolved ticket.
    if (owns.status === 'resolved') await sabiExecute({ sql: `UPDATE SabiSupportConversation SET status = 'open' WHERE id = ?`, args: [convId] }).catch(() => {});
  } else {
    convId = crypto.randomUUID();
    const subject = String(body.subject || text.slice(0, 60)).slice(0, 120);
    await sabiExecute({ sql: `INSERT INTO SabiSupportConversation (id, userId, subject) VALUES (?, ?, ?)`, args: [convId, s.id, subject] });
  }

  await postSupportMessage(convId, { body: text, authorName: s.name || 'Customer', fromAdmin: false });

  // Answer AFTER the response returns, so sending stays instant. The reply lands on the
  // customer's next poll. Falls back to escalation inside aiAutoReply on any failure.
  after(async () => { await aiAutoReply(convId).catch(() => {}); });

  return NextResponse.json({ ok: true, conversationId: convId });
}
