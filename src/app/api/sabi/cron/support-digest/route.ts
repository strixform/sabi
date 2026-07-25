import { NextRequest, NextResponse } from 'next/server';
import { sabiExecute } from '@/lib/tursoClient';
import { ensureSupportTables } from '@/lib/sabiSupportAI';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const preferredRegion = 'sfo1';

/**
 * Daily AI-support digest to the owner: "yesterday the AI answered X, escalated Y, resolved
 * Z, W still waiting" — trust-at-a-glance. Auth: Authorization: Bearer CRON_SECRET.
 * Scheduled 8am. Silent if OWNER_EMAIL/RESEND_API_KEY aren't set.
 */
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await ensureSupportTables();
  const n = async (sql: string) => Number(((await sabiExecute({ sql, args: [] }).catch(() => ({ rows: [{ v: 0 }] }))).rows[0] as any)?.v || 0);

  // "Yesterday" = the previous calendar day (this runs the next morning).
  const day = `date(createdAt) = date('now','-1 day')`;
  const aiAnswered = await n(`SELECT COUNT(*) v FROM SabiSupportMessage WHERE isAi = 1 AND ${day}`);
  const escalated = await n(`SELECT COUNT(*) v FROM SabiSupportMessage WHERE internal = 1 AND body LIKE '🤖 Escalated%' AND ${day}`);
  const humanReplies = await n(`SELECT COUNT(*) v FROM SabiSupportMessage WHERE fromAdmin = 1 AND isAi = 0 AND internal = 0 AND ${day}`);
  const resolved = await n(`SELECT COUNT(*) v FROM SabiSupportConversation WHERE status = 'resolved' AND date(updatedAt) = date('now','-1 day')`);
  const waiting = await n(`SELECT COUNT(*) v FROM SabiSupportConversation WHERE needsHuman = 1`);
  const newTickets = await n(`SELECT COUNT(*) v FROM SabiSupportConversation WHERE ${day}`);

  const to = process.env.OWNER_EMAIL || process.env.SABI_OWNER_EMAIL || process.env.SABI_ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  if (!to || !process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true, sent: false, stats: { aiAnswered, escalated, humanReplies, resolved, waiting, newTickets } });
  }
  // Nothing happened → don't send a noise email.
  if (aiAnswered + escalated + humanReplies + newTickets === 0 && waiting === 0) {
    return NextResponse.json({ ok: true, sent: false, quiet: true });
  }

  const APP = process.env.SABI_BASE_URL || 'https://sability.io';
  const row = (label: string, val: number, color: string) => `<tr><td style="padding:8px 12px;color:#94a3b8">${label}</td><td style="padding:8px 12px;text-align:right;font-weight:800;color:${color};font-size:18px">${val.toLocaleString()}</td></tr>`;
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.SABI_FROM_EMAIL || 'SABI <noreply@sability.io>',
      to,
      subject: `📊 SABI support — yesterday: AI answered ${aiAnswered}, ${waiting} waiting on you`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0f172a;color:#f1f5f9;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:24px;text-align:center"><h1 style="margin:0;color:#fff;font-size:20px">📊 Support — yesterday</h1></div>
        <div style="padding:20px">
          <table style="width:100%;border-collapse:collapse">
            ${row('🤖 Answered by AI', aiAnswered, '#60a5fa')}
            ${row('🙋 Escalated to a human', escalated, '#fbbf24')}
            ${row('👤 Replied by staff', humanReplies, '#a78bfa')}
            ${row('✅ Resolved', resolved, '#4ade80')}
            ${row('🆕 New tickets', newTickets, '#f1f5f9')}
            ${row('⏳ Still waiting on you now', waiting, waiting > 0 ? '#f87171' : '#4ade80')}
          </table>
          <div style="text-align:center;margin-top:20px"><a href="${APP}/sabi/admin/support?human=1" style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Open the queue →</a></div>
        </div></div>`,
    });
  } catch (e: any) { console.error('[sabi/cron/support-digest]', e?.message); }
  return NextResponse.json({ ok: true, sent: true, stats: { aiAnswered, escalated, humanReplies, resolved, waiting, newTickets } });
}
