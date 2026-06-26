import { NextRequest, NextResponse } from 'next/server';
import { allowOwnerOrStaff } from '@/lib/sabiStaff';
import { sabiExecute } from '@/lib/tursoClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;
export const preferredRegion = 'sfo1';

const SLA_HOURS = 72;

/**
 * Refunds desk for staff — look up an order's refund status when a customer
 * complains, plus the about-to-refund (SLA) and recent auto-refund lists.
 * Read-only (owner/staff).
 *
 * GET ?search=<orderId|email>  → matching orders with refund info
 * GET                          → pending SLA + recent auto-refunds
 */
export async function GET(req: NextRequest) {
  if (!(await allowOwnerOrStaff(req)).ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const q = async (sql: string, args: any[] = []) => {
    try { return (await sabiExecute({ sql, args })).rows as any[]; } catch { return []; }
  };
  const ngn = (k: number) => Math.round((Number(k) || 0) / 100);
  const shape = (o: any) => ({
    id: String(o.id), serviceType: o.serviceType, status: o.status,
    quantity: Number(o.quantity), delivered: Number(o.completedQuantity || 0),
    totalNaira: ngn(o.totalPrice), refundReason: o.refundReason || null,
    email: o.email || null, name: o.name || null, createdAt: o.createdAt,
  });

  const search = (req.nextUrl.searchParams.get('search') || '').trim();
  if (search) {
    const rows = await q(
      `SELECT o.id, o.serviceType, o.status, o.refundReason, o.quantity, o.completedQuantity,
              o.totalPrice, o.createdAt, u.email, u.name
       FROM SabiOrder o LEFT JOIN SabiUser u ON u.id = o.userId
       WHERE o.id LIKE ? OR LOWER(u.email) LIKE LOWER(?)
       ORDER BY o.createdAt DESC LIMIT 50`,
      [`%${search}%`, `%${search}%`],
    );
    return NextResponse.json({ mode: 'search', results: rows.map(shape) });
  }

  const cutoff = new Date(Date.now() - SLA_HOURS * 3600 * 1000).toISOString();
  const pending = await q(
    `SELECT o.id, o.serviceType, o.status, o.refundReason, o.quantity, o.completedQuantity,
            o.totalPrice, o.createdAt, u.email, u.name
     FROM SabiOrder o LEFT JOIN SabiUser u ON u.id = o.userId
     WHERE o.status IN ('executing','processing') AND o.createdAt < ?
       AND (o.dripChainId IS NULL OR o.dripChainId = '')
       AND COALESCE(o.completedQuantity,0) < o.quantity
     ORDER BY o.createdAt ASC LIMIT 50`,
    [cutoff],
  );
  const recent = await q(
    `SELECT o.id, o.serviceType, o.status, o.refundReason, o.quantity, o.completedQuantity,
            o.totalPrice, o.createdAt, u.email, u.name
     FROM SabiOrder o LEFT JOIN SabiUser u ON u.id = o.userId
     WHERE o.refundReason IS NOT NULL AND o.refundReason != '' AND o.status IN ('failed','completed')
     ORDER BY o.createdAt DESC LIMIT 40`,
  );
  return NextResponse.json({ mode: 'list', pending: pending.map(shape), recent: recent.map(shape) });
}
