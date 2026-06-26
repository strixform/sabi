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
  const checked = sp.get('checked') === '1' ? 1 : 0;
  const status = sp.get('status');
  const search = (sp.get('search') || '').trim();
  const limit = Math.min(parseInt(sp.get('limit') || '50'), 200);

  const where: string[] = ['COALESCE(o.staffChecked,0) = ?'];
  const args: any[] = [checked];
  if (status && status !== 'all') { where.push('o.status = ?'); args.push(status); }
  if (search) {
    where.push('(o.id LIKE ? OR LOWER(u.email) LIKE LOWER(?) OR LOWER(u.name) LIKE LOWER(?))');
    args.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  try {
    const r = await sabiExecute({
      sql: `SELECT o.id, o.serviceType, o.targetUrl, o.quantity, o.completedQuantity, o.status, o.createdAt,
                   COALESCE(o.staffChecked,0) AS staffChecked, o.staffCheckedAt, o.staffCheckedBy,
                   o.startCount, o.startScreenshotUrl,
                   u.email AS userEmail, u.name AS userName
            FROM SabiOrder o LEFT JOIN SabiUser u ON u.id = o.userId
            WHERE ${where.join(' AND ')}
            ORDER BY o.createdAt DESC LIMIT ?`,
      args: [...args, limit],
    });
    const orders = (r.rows as any[]).map(o => ({
      id: String(o.id), serviceType: o.serviceType, targetUrl: o.targetUrl,
      quantity: Number(o.quantity), completedQuantity: Number(o.completedQuantity || 0),
      status: o.status, createdAt: o.createdAt,
      staffChecked: Number(o.staffChecked) === 1, staffCheckedAt: o.staffCheckedAt || null, staffCheckedBy: o.staffCheckedBy || null,
      startCount: o.startCount === null || o.startCount === undefined ? null : Number(o.startCount),
      startScreenshotUrl: o.startScreenshotUrl || null,
      user: { email: o.userEmail || null, name: o.userName || null },
    }));
    return NextResponse.json({ success: true, orders });
  } catch (e: any) {
    return NextResponse.json({ success: true, orders: [], needsMigration: true });
  }
}
