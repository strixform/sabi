import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { sabiExecute } from '@/lib/tursoClient';
import { ensureSupportTables, postSupportMessage } from '@/lib/sabiSupportAI';

export const preferredRegion = 'sfo1';

/** Customer taps "Talk to a human" → flag the ticket for staff. */
export async function POST(req: NextRequest) {
  const s = await getSabiSession();
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensureSupportTables();
  const body = await req.json().catch(() => ({}));
  const convId = String(body.conversationId || '').trim();
  const owns = (await sabiExecute({ sql: `SELECT id FROM SabiSupportConversation WHERE id = ? AND userId = ? LIMIT 1`, args: [convId, s.id] })).rows[0] as any;
  if (!owns) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await sabiExecute({ sql: `UPDATE SabiSupportConversation SET needsHuman = 1, status = 'open', updatedAt = datetime('now') WHERE id = ?`, args: [convId] }).catch(() => {});
  await postSupportMessage(convId, { body: '🙋 Customer asked to talk to a human.', authorName: 'System', fromAdmin: true, internal: true });
  await postSupportMessage(convId, { body: "No problem — I've flagged this for a teammate. Someone will get back to you shortly. 🙏", authorName: 'SABI Support', fromAdmin: true });
  return NextResponse.json({ ok: true });
}
