/**
 * WEEKLY GROWTH DIGEST
 * GET /api/sabi/cron/weekly-digest — runs weekly via Vercel Cron.
 * Emails each buyer a summary of what was delivered for them this week.
 * Auth: Authorization: Bearer CRON_SECRET.
 */
import { NextRequest, NextResponse } from 'next/server';
import { sabiExecute } from '@/lib/tursoClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const preferredRegion = 'sfo1';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let rows: any[] = [];
  try {
    // Per-user delivery this week (completed orders), plus their most-ordered service.
    const r = await sabiExecute({
      sql: `SELECT userId,
                   COUNT(*) AS orders,
                   COALESCE(SUM(completedQuantity), 0) AS delivered
            FROM SabiOrder
            WHERE status = 'completed' AND completedAt >= datetime('now', '-7 days')
            GROUP BY userId
            HAVING delivered > 0
            ORDER BY delivered DESC
            LIMIT 200`,
      args: [],
    });
    rows = r.rows as any[];
  } catch (e: any) {
    return NextResponse.json({ skipped: true, reason: 'aggregate failed', msg: e?.message }, { status: 200 });
  }

  if (rows.length === 0) return NextResponse.json({ sent: 0, message: 'No completed orders this week' });

  const { sendGrowthDigestEmail } = await import('@/lib/email');
  let sent = 0;

  // Send in small parallel batches to stay within the function window.
  for (let i = 0; i < rows.length; i += 20) {
    const batch = rows.slice(i, i + 20);
    await Promise.allSettled(batch.map(async (row) => {
      const userId = row.userId as string;
      try {
        const u = await sabiExecute({ sql: `SELECT email, name, notifyEmail FROM SabiUser WHERE id = ? LIMIT 1`, args: [userId] });
        const user = u.rows[0] as any;
        if (!user || !user.email || user.notifyEmail === 0) return;
        const top = await sabiExecute({
          sql: `SELECT serviceType FROM SabiOrder WHERE userId = ? AND status = 'completed' AND completedAt >= datetime('now','-7 days') GROUP BY serviceType ORDER BY COUNT(*) DESC LIMIT 1`,
          args: [userId],
        });
        const topService = (top.rows[0] as any)?.serviceType || '';
        await sendGrowthDigestEmail(user.email, user.name || 'there', {
          orders: Number(row.orders || 0),
          delivered: Number(row.delivered || 0),
          topService,
        });
        sent++;
      } catch { /* skip individual failures */ }
    }));
  }

  return NextResponse.json({ sent, eligible: rows.length });
}
