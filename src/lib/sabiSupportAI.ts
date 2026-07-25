import { sabiExecute } from '@/lib/tursoClient';
import { getAnthropic } from '@/lib/sabiAI';
import crypto from 'crypto';

/**
 * SABI AI Support Agent — auto-answers customer support tickets so buyers get an instant,
 * grounded reply and staff only handle real escalations. Mirrors the Owlet support agent.
 *
 * SAFETY: never moves money (no refunds/credits), never reveals suppliers/pricing/taskers
 * or that fulfilment is a crowd ("real people" only), never promises delivery times the
 * data doesn't support. Replies as "SABI Support" — the customer never knows it's AI.
 * Kill switch: env SABI_SUPPORT_AI=0.
 */

const MODEL = process.env.SABI_SUPPORT_AI_MODEL || 'claude-haiku-4-5-20251001';
const MAX_AI_REPLIES = 3;

let ready = false;
export async function ensureSupportTables() {
  if (ready) return;
  await sabiExecute({ sql: `CREATE TABLE IF NOT EXISTS SabiSupportConversation (
    id TEXT PRIMARY KEY, userId TEXT NOT NULL, subject TEXT,
    status TEXT NOT NULL DEFAULT 'open', needsHuman INTEGER NOT NULL DEFAULT 0,
    aiReplyCount INTEGER NOT NULL DEFAULT 0, lastMessageFromAdmin INTEGER NOT NULL DEFAULT 0,
    assignedAdmin TEXT, createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')))` }).catch(() => {});
  await sabiExecute({ sql: `CREATE TABLE IF NOT EXISTS SabiSupportMessage (
    id TEXT PRIMARY KEY, conversationId TEXT NOT NULL, authorName TEXT,
    fromAdmin INTEGER NOT NULL DEFAULT 0, internal INTEGER NOT NULL DEFAULT 0,
    body TEXT NOT NULL, createdAt TEXT NOT NULL DEFAULT (datetime('now')))` }).catch(() => {});
  // Customers can attach a screenshot (payment receipt, profile shot) — the AI reads it.
  await sabiExecute({ sql: `ALTER TABLE SabiSupportMessage ADD COLUMN imageUrl TEXT` }).catch(() => {});
  // isAi distinguishes a genuine AI reply from a human staff reply (both post as "SABI
  // Support") — used by the daily digest to count AI vs human accurately.
  await sabiExecute({ sql: `ALTER TABLE SabiSupportMessage ADD COLUMN isAi INTEGER NOT NULL DEFAULT 0` }).catch(() => {});
  await sabiExecute({ sql: `CREATE INDEX IF NOT EXISTS idx_sabisupportmsg_conv ON SabiSupportMessage(conversationId, createdAt)` }).catch(() => {});
  await sabiExecute({ sql: `CREATE INDEX IF NOT EXISTS idx_sabisupportconv_status ON SabiSupportConversation(status, needsHuman, updatedAt)` }).catch(() => {});
  ready = true;
}

export async function postSupportMessage(conversationId: string, opts: { body: string; authorName: string; fromAdmin: boolean; internal?: boolean; imageUrl?: string | null; isAi?: boolean }) {
  await sabiExecute({
    sql: `INSERT INTO SabiSupportMessage (id, conversationId, authorName, fromAdmin, internal, body, imageUrl, isAi) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [crypto.randomUUID(), conversationId, opts.authorName, opts.fromAdmin ? 1 : 0, opts.internal ? 1 : 0, String(opts.body).slice(0, 4000), opts.imageUrl || null, opts.isAi ? 1 : 0],
  }).catch(() => {});
  await sabiExecute({ sql: `UPDATE SabiSupportConversation SET updatedAt = datetime('now'), lastMessageFromAdmin = ? WHERE id = ?`, args: [opts.fromAdmin && !opts.internal ? 1 : 0, conversationId] }).catch(() => {});
}

/** Pull the customer's real account context so the AI answers from facts, not guesses. */
async function loadContext(userId: string) {
  const [wallet, orders, txns, user] = await Promise.all([
    sabiExecute({ sql: `SELECT balance, totalSpent FROM SabiWallet WHERE userId = ? LIMIT 1`, args: [userId] }).catch(() => ({ rows: [] as any[] })),
    sabiExecute({ sql: `SELECT id, serviceType, status, quantity, completedQuantity, targetUrl, totalPrice, createdAt FROM SabiOrder WHERE userId = ? ORDER BY createdAt DESC LIMIT 10`, args: [userId] }).catch(() => ({ rows: [] as any[] })),
    sabiExecute({ sql: `SELECT type, amount, description, createdAt FROM SabiTransaction WHERE userId = ? ORDER BY createdAt DESC LIMIT 6`, args: [userId] }).catch(() => ({ rows: [] as any[] })),
    sabiExecute({ sql: `SELECT name, email FROM SabiUser WHERE id = ? LIMIT 1`, args: [userId] }).catch(() => ({ rows: [] as any[] })),
  ]);
  const w = (wallet.rows[0] as any) || {};
  const naira = (kobo: any) => `₦${Math.round(Number(kobo || 0) / 100).toLocaleString()}`;
  const lines: string[] = [];
  lines.push(`Customer: ${(user.rows[0] as any)?.name || 'there'}`);
  lines.push(`Wallet balance: ${naira(w.balance)} (lifetime spent ${naira(w.totalSpent)})`);
  lines.push(`Recent orders (${orders.rows.length}):`);
  for (const o of orders.rows as any[]) {
    lines.push(`  • #${o.id} ${o.serviceType} ×${o.quantity} — status ${o.status}, delivered ${o.completedQuantity || 0}/${o.quantity}, ${naira(o.totalPrice)}, target ${o.targetUrl}, ${String(o.createdAt).slice(0, 10)}`);
  }
  lines.push(`Recent wallet transactions (${txns.rows.length}):`);
  for (const t of txns.rows as any[]) lines.push(`  • ${t.type} ${naira(t.amount)} — ${t.description || ''} (${String(t.createdAt).slice(0, 10)})`);
  return lines.join('\n');
}

const SYSTEM = `You are "SABI Support" — the friendly, sharp support agent for SABI (sability.io), a Nigerian social-media marketing service where customers buy followers, likes, views, comments and engagement for their own social accounts.

Answer the customer's LATEST message using ONLY the account facts provided (their orders, wallet, transactions) and general SABI knowledge. Be warm, concise, and human — the customer must never know you are an AI.

If the customer attached a screenshot, READ it (a payment receipt, a profile shot, an error message) and use what it shows — the amount, reference, whether their profile is private, etc.

MIRROR THE CUSTOMER'S LANGUAGE exactly: if they write Nigerian Pidgin, reply in Pidgin ("No wahala, I don check am for you…"); Yoruba→Yoruba, Hausa→Hausa, Igbo→Igbo; plain English→English.

HARD RULES (never break):
- NEVER reveal how orders are fulfilled beyond "real people" — never mention taskers, a crowd, gamers360, providers, panels, or costs/margins.
- NEVER move money or promise a refund, credit, or a specific delivery time/date. You can explain status from the data, not make guarantees.
- If you don't have enough to resolve it (a refund decision, an unconfirmed payment, a ban/block, an angry or repeating customer, anything you're unsure about) → set escalate=true and still reply warmly ("Let me get a teammate to sort this for you right away").
- Do NOT escalate greetings, thanks, small-talk, simple questions, or plain status reads — just answer those (escalate=false, and set resolved=true when the issue is fully handled).
- Keep replies short (2-5 sentences). Nigerian-friendly, respectful.`;

/**
 * Auto-reply to the latest customer message in a conversation. Idempotent-ish: only runs
 * when the last message is from the customer and the conv isn't taken over by a human.
 */
export async function aiAutoReply(conversationId: string): Promise<{ replied: boolean; escalated?: boolean; note?: string }> {
  if (process.env.SABI_SUPPORT_AI === '0') return { replied: false, note: 'disabled' };
  const client = getAnthropic();
  if (!client) return { replied: false, note: 'no-key' };
  await ensureSupportTables();

  const conv = (await sabiExecute({ sql: `SELECT id, userId, status, needsHuman, aiReplyCount, assignedAdmin, lastMessageFromAdmin FROM SabiSupportConversation WHERE id = ? LIMIT 1`, args: [conversationId] }).catch(() => ({ rows: [] as any[] }))).rows[0] as any;
  if (!conv) return { replied: false, note: 'no-conv' };
  // A human took over → AI stays out.
  if (conv.assignedAdmin) return { replied: false, note: 'assigned' };
  // Last message already from staff/AI → nothing to answer.
  if (Number(conv.lastMessageFromAdmin) === 1) return { replied: false, note: 'already-answered' };
  if (Number(conv.aiReplyCount) >= MAX_AI_REPLIES) {
    await sabiExecute({ sql: `UPDATE SabiSupportConversation SET needsHuman = 1, updatedAt = datetime('now') WHERE id = ?`, args: [conversationId] }).catch(() => {});
    return { replied: false, escalated: true, note: 'max-ai-replies' };
  }

  const msgs = (await sabiExecute({ sql: `SELECT authorName, fromAdmin, internal, body, imageUrl FROM SabiSupportMessage WHERE conversationId = ? ORDER BY createdAt ASC LIMIT 16`, args: [conversationId] }).catch(() => ({ rows: [] as any[] }))).rows as any[];
  const visible = msgs.filter(m => Number(m.internal) !== 1);
  const transcript = visible.map(m => `${Number(m.fromAdmin) === 1 ? 'Support' : 'Customer'}: ${m.body}${m.imageUrl ? ' [attached a screenshot]' : ''}`).join('\n');
  let context = await loadContext(String(conv.userId));

  // PAYMENT-hint: if they're asking about a payment/funding, re-verify their pending
  // payments with Flutterwave FIRST (idempotent — only credits what genuinely landed) and
  // feed the truth in, so the AI answers "it's now credited" instead of guessing.
  const lastCustomer = [...visible].reverse().find(m => Number(m.fromAdmin) !== 1);
  if (lastCustomer && /\b(paid|payment|fund|funded|deposit|debit|debited|transfer|receipt|money|wallet|top ?up|reflect|credited|charged)\b/i.test(String(lastCustomer.body))) {
    try {
      const { recheckUserPayments } = await import('@/lib/sabiWallet');
      const r = await recheckUserPayments(String(conv.userId));
      if (r?.summary) context += `\n\nLIVE PAYMENT RE-CHECK (just ran against Flutterwave): ${r.summary}`;
    } catch { /* best-effort */ }
  }

  // Any screenshots the customer attached (last 2, public Blob URLs) → Claude vision blocks.
  const images = visible.filter(m => Number(m.fromAdmin) !== 1 && m.imageUrl).map(m => String(m.imageUrl)).slice(-2);

  let out: { message: string; escalate: boolean; resolved: boolean; escalate_reason?: string } | null = null;
  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: SYSTEM,
      tools: [{
        name: 'respond',
        description: 'Send the reply to the customer.',
        input_schema: {
          type: 'object',
          properties: {
            message: { type: 'string', description: "The reply to the customer, in their language." },
            escalate: { type: 'boolean', description: 'true if a human teammate must take over.' },
            escalate_reason: { type: 'string', description: 'If escalating, a short staff-only reason.' },
            resolved: { type: 'boolean', description: 'true if this reply fully resolves the ticket.' },
          },
          required: ['message', 'escalate', 'resolved'],
        },
      }],
      tool_choice: { type: 'tool', name: 'respond' },
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `ACCOUNT CONTEXT:\n${context}\n\nCONVERSATION SO FAR:\n${transcript}\n\n${images.length ? `The customer attached ${images.length} screenshot(s) below — read them (a payment receipt, a profile shot, an error, etc.) and use what they show.\n\n` : ''}Reply to the customer's latest message.` },
          ...images.map((url) => ({ type: 'image' as const, source: { type: 'url' as const, url } })),
        ],
      }],
    });
    const block = res.content.find((b: any) => b.type === 'tool_use') as any;
    if (block?.input?.message) out = block.input;
  } catch (e: any) {
    console.error('[sabiSupportAI] claude', e?.message);
  }
  if (!out) {
    // Model failed → escalate so the customer isn't left hanging.
    await sabiExecute({ sql: `UPDATE SabiSupportConversation SET needsHuman = 1, updatedAt = datetime('now') WHERE id = ?`, args: [conversationId] }).catch(() => {});
    return { replied: false, escalated: true, note: 'model-failed' };
  }

  await postSupportMessage(conversationId, { body: out.message, authorName: 'SABI Support', fromAdmin: true, isAi: true });
  const willEscalate = !!out.escalate;
  const willResolve = !willEscalate && !!out.resolved;
  await sabiExecute({
    sql: `UPDATE SabiSupportConversation SET aiReplyCount = aiReplyCount + 1, needsHuman = ?, status = ?, updatedAt = datetime('now') WHERE id = ?`,
    args: [willEscalate ? 1 : 0, willResolve ? 'resolved' : 'open', conversationId],
  }).catch(() => {});
  if (willEscalate) {
    await postSupportMessage(conversationId, { body: `🤖 Escalated to a human — ${out.escalate_reason || 'AI was not confident it could resolve this'}`, authorName: 'System', fromAdmin: true, internal: true });
    notifyOwnerOfEscalation(conversationId).catch(() => {});
  }
  return { replied: true, escalated: willEscalate };
}

async function notifyOwnerOfEscalation(conversationId: string) {
  try {
    // Falls back to the admin email SABI already knows — no new env needed.
    const to = process.env.OWNER_EMAIL || process.env.SABI_OWNER_EMAIL || process.env.SABI_ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    if (!to || !process.env.RESEND_API_KEY) return;
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const APP = process.env.SABI_BASE_URL || 'https://sability.io';
    await resend.emails.send({
      from: process.env.SABI_FROM_EMAIL || 'SABI <noreply@sability.io>',
      to,
      subject: '🙋 A SABI support ticket needs a human',
      html: `<p>A support ticket was escalated and needs a teammate.</p><p><a href="${APP}/sabi/admin/support?human=1">Open the Needs-human queue →</a></p>`,
    });
  } catch { /* best-effort */ }
}
