import { NextRequest, NextResponse } from 'next/server';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
import { sabiExecute } from '@/lib/tursoClient';

export const maxDuration = 20;
export const preferredRegion = 'sfo1';

/**
 * Diagnose why a specific user's orders aren't showing.
 * GET /api/sabi/admin/diagnose-user?email=foo@bar.com   (admin only)
 *
 * Shows the user's id and whether SabiOrder rows actually exist under that id —
 * distinguishes a real "no orders" from a userId/session mismatch.
 */
export async function GET(req: NextRequest) {
  if (!await checkSabiAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const email = (req.nextUrl.searchParams.get('email') || '').trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'email query param required' }, { status: 400 });

  try {
    // Find the user(s) with this email (case-insensitive).
    const users = await sabiExecute({
      sql: `SELECT id, email, name, createdAt FROM SabiUser WHERE lower(email) = ? LIMIT 5`,
      args: [email],
    });
    if (users.rows.length === 0) {
      return NextResponse.json({ found: false, note: 'No SabiUser with that email.' });
    }

    const report: any[] = [];
    for (const u of users.rows as any[]) {
      const cnt = await sabiExecute({ sql: `SELECT COUNT(*) AS c FROM SabiOrder WHERE userId = ?`, args: [u.id] });
      const sample = await sabiExecute({
        sql: `SELECT id, serviceType, quantity, status, createdAt FROM SabiOrder WHERE userId = ? ORDER BY createdAt DESC LIMIT 5`,
        args: [u.id],
      });
      report.push({
        userId: u.id,
        email: u.email,
        name: u.name,
        orderCount: Number((cnt.rows[0] as any)?.c || 0),
        recentOrders: (sample.rows as any[]).map(o => ({ id: o.id, serviceType: o.serviceType, quantity: o.quantity, status: o.status, createdAt: o.createdAt })),
      });
    }

    // Also check for orders whose userId is the email itself (legacy/mismatch).
    const byEmail = await sabiExecute({ sql: `SELECT COUNT(*) AS c FROM SabiOrder WHERE lower(userId) = ?`, args: [email] });
    const ordersUnderEmail = Number((byEmail.rows[0] as any)?.c || 0);

    return NextResponse.json({
      found: true,
      accounts: report,
      duplicateAccounts: users.rows.length > 1,
      ordersStoredUnderEmailAsUserId: ordersUnderEmail,
      note: report.some(r => r.orderCount > 0)
        ? 'Orders exist under this user id — if the page is empty it is a session/cache issue, not data. Have them hard-refresh.'
        : (ordersUnderEmail > 0
            ? 'Orders are stored with the EMAIL as userId, not the account id — a data mismatch to migrate.'
            : (users.rows.length > 1
                ? 'Multiple accounts share this email — orders may be under the other account id.'
                : 'This user genuinely has no orders under their id.')),
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Diagnose failed', detail: e?.message }, { status: 500 });
  }
}
