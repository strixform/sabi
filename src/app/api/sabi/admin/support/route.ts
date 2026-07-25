import { NextRequest, NextResponse } from 'next/server';
import { allowOwnerOrStaff, logStaffAction } from '@/lib/sabiStaff';
import { sabiExecute } from '@/lib/tursoClient';
import { ensureSupportTables, postSupportMessage } from '@/lib/sabiSupportAI';

export const preferredRegion = 'sfo1';
export const maxDuration = 20;

/**
 * Staff support inbox. GET ?human=1 → only tickets the AI escalated (the working queue);
 * ?conversationId= → one thread (incl. internal AI notes). POST {conversationId, action}.
 */
export async function GET(req: NextRequest) {
  const auth = await allowOwnerOrStaff(req);
  if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await ensureSupportTables();
  const sp = req.nextUrl.searchParams;
  const convId = sp.get('conversationId');

  if (convId) {
    const conv = (await sabiExecute({ sql: `SELECT c.id, c.subject, c.status, c.needsHuman, c.assignedAdmin, c.aiReplyCount, u.name, u.email FROM SabiSupportConversation c LEFT JOIN SabiUser u ON u.id = c.userId WHERE c.id = ? LIMIT 1`, args: [convId] })).rows[0] as any;
    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const messages = (await sabiExecute({ sql: `SELECT id, authorName, fromAdmin, internal, body, createdAt FROM SabiSupportMessage WHERE conversationId = ? ORDER BY createdAt ASC LIMIT 300`, args: [convId] })).rows as any[];
    return NextResponse.json({ conversation: { id: conv.id, subject: conv.subject, status: conv.status, needsHuman: Number(conv.needsHuman) === 1, assignedAdmin: conv.assignedAdmin, customer: { name: conv.name, email: conv.email } }, messages });
  }

  const human = sp.get('human') === '1';
  const where = human ? `WHERE c.needsHuman = 1` : `WHERE c.status != 'resolved'`;
  const rows = (await sabiExecute({
    sql: `SELECT c.id, c.subject, c.status, c.needsHuman, c.assignedAdmin, c.updatedAt, u.name, u.email,
                 (SELECT body FROM SabiSupportMessage m WHERE m.conversationId = c.id AND m.internal = 0 ORDER BY m.createdAt DESC LIMIT 1) AS lastMessage
          FROM SabiSupportConversation c LEFT JOIN SabiUser u ON u.id = c.userId ${where}
          ORDER BY c.needsHuman DESC, c.updatedAt DESC LIMIT 100`,
    args: [],
  }).catch(() => ({ rows: [] as any[] }))).rows as any[];
  const openCount = Number(((await sabiExecute({ sql: `SELECT COUNT(*) AS n FROM SabiSupportConversation WHERE status != 'resolved'`, args: [] }).catch(() => ({ rows: [{ n: 0 }] }))).rows[0] as any)?.n || 0);
  const humanCount = Number(((await sabiExecute({ sql: `SELECT COUNT(*) AS n FROM SabiSupportConversation WHERE needsHuman = 1`, args: [] }).catch(() => ({ rows: [{ n: 0 }] }))).rows[0] as any)?.n || 0);
  return NextResponse.json({ conversations: rows.map(r => ({ id: r.id, subject: r.subject, status: r.status, needsHuman: Number(r.needsHuman) === 1, assignedAdmin: r.assignedAdmin, updatedAt: r.updatedAt, customer: { name: r.name, email: r.email }, lastMessage: r.lastMessage })), openCount, humanCount });
}

export async function POST(req: NextRequest) {
  const auth = await allowOwnerOrStaff(req);
  if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await ensureSupportTables();
  const body = await req.json().catch(() => ({}));
  const convId = String(body.conversationId || '').trim();
  const action = String(body.action || '');
  if (!convId) return NextResponse.json({ error: 'conversationId required' }, { status: 400 });

  if (action === 'reply') {
    const text = String(body.body || '').trim();
    if (!text) return NextResponse.json({ error: 'Type a reply.' }, { status: 400 });
    // A human is now on it: post the reply, clear the escalation, take ownership so the AI stays out.
    await postSupportMessage(convId, { body: text, authorName: 'SABI Support', fromAdmin: true });
    await sabiExecute({ sql: `UPDATE SabiSupportConversation SET needsHuman = 0, status = 'open', assignedAdmin = ?, updatedAt = datetime('now') WHERE id = ?`, args: [auth.email || 'staff', convId] }).catch(() => {});
    logStaffAction(auth.email || 'owner', 'support:reply', convId).catch(() => {});
    return NextResponse.json({ ok: true });
  }
  if (action === 'resolve') {
    await sabiExecute({ sql: `UPDATE SabiSupportConversation SET status = 'resolved', needsHuman = 0, updatedAt = datetime('now') WHERE id = ?`, args: [convId] }).catch(() => {});
    logStaffAction(auth.email || 'owner', 'support:resolve', convId).catch(() => {});
    return NextResponse.json({ ok: true });
  }
  if (action === 'reopen') {
    await sabiExecute({ sql: `UPDATE SabiSupportConversation SET status = 'open', updatedAt = datetime('now') WHERE id = ?`, args: [convId] }).catch(() => {});
    return NextResponse.json({ ok: true });
  }
  if (action === 'release') {
    // Hand it back to the AI (clear ownership).
    await sabiExecute({ sql: `UPDATE SabiSupportConversation SET assignedAdmin = NULL, updatedAt = datetime('now') WHERE id = ?`, args: [convId] }).catch(() => {});
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
