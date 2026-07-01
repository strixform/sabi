import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { createSabiOrder } from '@/lib/sabiOrderEngine';
import { getService } from '@/lib/sabiServices';
import { getRateLimitKey, checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { getActingAccount, canSpend } from '@/lib/sabiTeam';

export const maxDuration = 60;
export const preferredRegion = 'sfo1';

const MAX_ROWS = 100;

/**
 * POST /api/sabi/orders/bulk
 * Place many orders at once from a CSV. body: { rows: [{serviceId, targetUrl, quantity}] }
 * Each row is a normal wallet order (silent — no per-row email). Stops nothing
 * on a row failure; returns a per-row result so the buyer sees what went through.
 */
export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(getRateLimitKey(req, 'order-bulk'), 5, 60 * 60000);
  if (!rl.allowed) return rateLimitResponse(5, rl.resetTime);

  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const acct = await getActingAccount(session.id);
  if (acct.delegated && !canSpend(acct.role)) {
    return NextResponse.json({ error: 'You have view-only access to this account and cannot place orders.' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (rows.length === 0) return NextResponse.json({ error: 'No rows provided.' }, { status: 400 });
  if (rows.length > MAX_ROWS) return NextResponse.json({ error: `Max ${MAX_ROWS} rows per upload.` }, { status: 400 });

  const results: { row: number; serviceId: string; targetUrl: string; quantity: number; success: boolean; orderId?: string; error?: string }[] = [];
  let placed = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] || {};
    const serviceId = String(r.serviceId || '').trim();
    const targetUrl = String(r.targetUrl || '').trim();
    const quantity = parseInt(r.quantity);

    if (!serviceId || !targetUrl || !Number.isFinite(quantity) || quantity < 1) {
      results.push({ row: i + 1, serviceId, targetUrl, quantity: quantity || 0, success: false, error: 'Missing/invalid serviceId, url or quantity' });
      continue;
    }
    if (!getService(serviceId)) {
      results.push({ row: i + 1, serviceId, targetUrl, quantity, success: false, error: 'Unknown serviceId' });
      continue;
    }

    const result = await createSabiOrder({
      userId: acct.accountId,
      serviceId,
      targetUrl,
      quantity,
      paymentMethod: 'wallet',
      silent: true, // one upload — don't fire 100 emails
    });

    if (result.success && result.orderId) {
      placed++;
      results.push({ row: i + 1, serviceId, targetUrl, quantity, success: true, orderId: result.orderId });
    } else {
      results.push({ row: i + 1, serviceId, targetUrl, quantity, success: false, error: result.error || 'Failed' });
    }
  }

  return NextResponse.json({ success: true, total: rows.length, placed, failed: rows.length - placed, results });
}
