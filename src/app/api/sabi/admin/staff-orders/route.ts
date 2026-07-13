import { NextRequest, NextResponse } from 'next/server';
import { allowOwnerOrStaff } from '@/lib/sabiStaff';
import { sabiExecute } from '@/lib/tursoClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;
export const preferredRegion = 'sfo1';

/**
 * Orders for the staff proof-review lanes. Raw SQL so it can filter on the guarded
 * staffChecked column (not in the Prisma model). GET ?checked=0|1&status=&search=
 *   checked=0 → "Orders & Proofs" (still to review)
 *   checked=1 → "Checked Orders" (done)
 */
export async function GET(req: NextRequest) {
  if (!(await allowOwnerOrStaff(req)).ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  // checked=0 → to-review lane · checked=1 → checked lane · checked=all → BOTH lanes
  // (used by the "Find Orders" search so staff can pull a user's full history —
  // paid orders AND refills — regardless of review state).
  const checkedParam = sp.get('checked');
  const allLanes = checkedParam === 'all';
  const checked = checkedParam === '1' ? 1 : 0;
  const status = sp.get('status');
  const search = (sp.get('search') || '').trim();
  // Filter to one service (serviceType id) so staff can review every order for a
  // service and tell a systemic problem from a one-off customer mistake.
  const service = (sp.get('service') || '').trim();
  const limit = Math.min(parseInt(sp.get('limit') || '50'), 200);

  const where: string[] = [];
  const args: any[] = [];
  if (!allLanes) { where.push('COALESCE(o.staffChecked,0) = ?'); args.push(checked); }
  if (status && status !== 'all') { where.push('o.status = ?'); args.push(status); }
  if (service) { where.push('o.serviceType = ?'); args.push(service); }
  if (search) {
    // Match order id, email, name, or business name — "search username or email".
    where.push('(o.id LIKE ? OR LOWER(u.email) LIKE LOWER(?) OR LOWER(u.name) LIKE LOWER(?) OR LOWER(u.businessName) LIKE LOWER(?))');
    args.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  const whereSql = where.length ? where.join(' AND ') : '1=1';

  try {
    const r = await sabiExecute({
      sql: `SELECT o.id, o.serviceType, o.targetUrl, o.quantity, o.completedQuantity, o.status, o.createdAt,
                   COALESCE(o.staffChecked,0) AS staffChecked, o.staffCheckedAt, o.staffCheckedBy,
                   o.startCount, o.startScreenshotUrl, o.customRef, o.paymentMethod, o.commentInstructions,
                   u.email AS userEmail, u.name AS userName, u.businessName AS userBusiness
            FROM SabiOrder o LEFT JOIN SabiUser u ON u.id = o.userId
            WHERE ${whereSql}
            ORDER BY o.createdAt DESC LIMIT ?`,
      args: [...args, limit],
    });
    const orders = (r.rows as any[]).map(o => {
      const customRef = o.customRef || null;
      const refillOf = typeof customRef === 'string' && customRef.startsWith('refill:') ? customRef.slice('refill:'.length) : null;
      return {
        id: String(o.id), serviceType: o.serviceType, targetUrl: o.targetUrl,
        quantity: Number(o.quantity), completedQuantity: Number(o.completedQuantity || 0),
        status: o.status, createdAt: o.createdAt,
        staffChecked: Number(o.staffChecked) === 1, staffCheckedAt: o.staffCheckedAt || null, staffCheckedBy: o.staffCheckedBy || null,
        startCount: o.startCount === null || o.startCount === undefined ? null : Number(o.startCount),
        startScreenshotUrl: o.startScreenshotUrl || null,
        // A refill is either linked via customRef (refill:<id>) or paid by the
        // 'refill' method — surface both so staff always see it as a refill.
        refillOf,
        isRefill: refillOf != null || o.paymentMethod === 'refill',
        // Buyer brief (comment/vote target etc.) — e.g. "🗳 VOTE FOR: …" for poll orders.
        instructions: o.commentInstructions || null,
        voteTarget: typeof o.commentInstructions === 'string' && o.commentInstructions.includes('VOTE FOR:')
          ? o.commentInstructions.split('VOTE FOR:')[1].split('|')[0].trim() : null,
        user: { email: o.userEmail || null, name: o.userName || null, businessName: o.userBusiness || null },
      };
    });
    // Accurate total for the same filters (the list is capped at `limit`), so staff
    // can gauge scale — e.g. how many orders exist for a filtered service.
    let total = orders.length;
    try {
      const c = await sabiExecute({
        sql: `SELECT COUNT(*) AS n FROM SabiOrder o LEFT JOIN SabiUser u ON u.id = o.userId WHERE ${whereSql}`,
        args,
      });
      total = Number((c.rows[0] as any)?.n ?? orders.length);
    } catch { /* fall back to loaded count */ }

    return NextResponse.json({ success: true, orders, total });
  } catch (e: any) {
    return NextResponse.json({ success: true, orders: [], needsMigration: true });
  }
}
