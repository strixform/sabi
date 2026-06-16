/**
 * SABI Admin — Users list (comprehensive)
 * GET /api/sabi/admin/users
 *
 * Returns SABI users with wallet balances AND per-user order aggregates
 * (order count, completed, total order value, last order) so admins can
 * track customers at a glance. Direct libsql (sabiExecute) — NOT Prisma —
 * to avoid the 10-80s cold-start that made this tab load slowly.
 *
 * Query params:
 *   search  — email / name / phone
 *   status  — user status (active / banned)
 *   sort    — created | spent | orders | recent   (default: recent)
 *   limit   — default 50, max 200
 *   offset  — pagination offset
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
import { sabiExecute } from '@/lib/tursoClient';

export const preferredRegion = 'sfo1';
export const maxDuration = 15;

const SORTS: Record<string, string> = {
  created: 'u.createdAt DESC',
  spent:   'totalSpent DESC',
  orders:  'orderCount DESC',
  recent:  'lastOrderAt IS NULL, lastOrderAt DESC, u.createdAt DESC',
};

export async function GET(req: NextRequest) {
  if (!await checkSabiAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim() || '';
  const status = searchParams.get('status') || '';
  const sort   = SORTS[searchParams.get('sort') || 'recent'] || SORTS.recent;
  const limit  = Math.min(parseInt(searchParams.get('limit')  || '50'),  200);
  const offset = parseInt(searchParams.get('offset') || '0');

  const conds: string[] = [];
  const args: any[] = [];
  if (search) {
    conds.push('(u.email LIKE ? OR u.name LIKE ? OR u.phone LIKE ?)');
    const like = `%${search}%`;
    args.push(like, like, like);
  }
  if (status) { conds.push('u.status = ?'); args.push(status); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  try {
    // Per-user order aggregates joined in one pass (SabiOrder is small / low-volume).
    const rowsResult = await sabiExecute({
      sql: `SELECT u.id, u.email, u.name, u.status, u.emailVerified, u.phone,
                   u.businessName, u.createdAt, u.sessionExpiry,
                   COALESCE(w.balance, 0)      AS balance,
                   COALESCE(w.totalSpent, 0)   AS totalSpent,
                   COALESCE(w.totalFunded, 0)  AS totalFunded,
                   COALESCE(o.orderCount, 0)      AS orderCount,
                   COALESCE(o.completedOrders, 0) AS completedOrders,
                   COALESCE(o.totalOrderValue, 0) AS totalOrderValue,
                   o.lastOrderAt
            FROM SabiUser u
            LEFT JOIN SabiWallet w ON w.userId = u.id
            LEFT JOIN (
              SELECT userId,
                     COUNT(*) AS orderCount,
                     SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completedOrders,
                     SUM(totalPrice + platformFee) AS totalOrderValue,
                     MAX(createdAt) AS lastOrderAt
              FROM SabiOrder GROUP BY userId
            ) o ON o.userId = u.id
            ${where}
            ORDER BY ${sort}
            LIMIT ? OFFSET ?`,
      args: [...args, limit, offset],
    });

    const countResult = await sabiExecute({
      sql: `SELECT COUNT(*) AS total FROM SabiUser u ${where}`,
      args,
    });
    const total = Number((countResult.rows[0] as any)?.total ?? 0);

    return NextResponse.json({
      success: true,
      users: (rowsResult.rows as any[]).map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        phone: u.phone || null,
        businessName: u.businessName || null,
        status: u.status,
        emailVerified: !!u.emailVerified,
        balance:      Number(u.balance),       // kobo
        totalSpent:   Number(u.totalSpent),    // kobo
        totalFunded:  Number(u.totalFunded),   // kobo
        orderCount:      Number(u.orderCount),
        completedOrders: Number(u.completedOrders),
        totalOrderValue: Number(u.totalOrderValue), // kobo
        lastOrderAt:  u.lastOrderAt || null,
        lastAuth:     u.sessionExpiry || null,
        createdAt:    u.createdAt,
      })),
      total,
      limit,
      offset,
    });
  } catch (e: any) {
    console.error('[admin/users]', e?.message);
    return NextResponse.json({ error: 'Failed to load users', detail: e?.message?.slice(0, 140) }, { status: 500 });
  }
}

/**
 * DELETE — remove an EMPTY account (e.g. a case-duplicate). Hard-guarded: refuses
 * if the user has any balance, has ever funded, or has any orders. Money/order
 * accounts can never be deleted here.
 */
export async function DELETE(req: NextRequest) {
  if (!await checkSabiAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId || '').trim();
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  try {
    const chk = await sabiExecute({
      sql: `SELECT u.email,
                   COALESCE(w.balance, 0)     AS balance,
                   COALESCE(w.totalFunded, 0) AS totalFunded,
                   (SELECT COUNT(*) FROM SabiOrder WHERE userId = ?) AS orders
            FROM SabiUser u LEFT JOIN SabiWallet w ON w.userId = u.id
            WHERE u.id = ? LIMIT 1`,
      args: [userId, userId],
    });
    const row = chk.rows[0] as any;
    if (!row) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const balance = Number(row.balance || 0);
    const funded = Number(row.totalFunded || 0);
    const orders = Number(row.orders || 0);
    if (balance > 0 || funded > 0 || orders > 0) {
      return NextResponse.json({
        error: `Can't delete — this account has activity (balance ₦${(balance/100).toLocaleString()}, funded ₦${(funded/100).toLocaleString()}, ${orders} order(s)). Only empty accounts can be deleted.`,
      }, { status: 400 });
    }

    // Empty account — safe to remove. Wallet first, then any referral rows, then user.
    await sabiExecute({ sql: `DELETE FROM SabiWallet WHERE userId = ?`, args: [userId] }).catch(() => {});
    await sabiExecute({ sql: `DELETE FROM SabiReferral WHERE referrerId = ? OR referredId = ?`, args: [userId, userId] }).catch(() => {});
    await sabiExecute({ sql: `DELETE FROM SabiUser WHERE id = ?`, args: [userId] });

    return NextResponse.json({ success: true, message: `Deleted empty account ${row.email}.` });
  } catch (e: any) {
    console.error('[admin/users DELETE]', e?.message);
    return NextResponse.json({ error: 'Delete failed', detail: e?.message?.slice(0, 140) }, { status: 500 });
  }
}
