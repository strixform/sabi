import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { sabiExecute } from '@/lib/tursoClient';
import { createSabiOrder } from '@/lib/sabiOrderEngine';
import { getBundleById, computeBundleTotal } from '@/lib/servicesCatalog';

export const maxDuration = 30; // creates several orders sequentially
export const preferredRegion = 'sfo1';

/**
 * POST /api/sabi/orders/bundle  { bundleId, targetUrl, paymentMethod }
 * Buys a curated pack: one target URL fans out into one order per bundle item
 * (each becomes its own gamerz360 campaign). Pre-checks wallet balance against
 * the full pack total so we never half-charge.
 */
export async function POST(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { bundleId, targetUrl, paymentMethod } = body;
  if (!bundleId || !targetUrl) return NextResponse.json({ error: 'Missing bundleId or targetUrl' }, { status: 400 });

  const bundle = getBundleById(bundleId);
  if (!bundle) return NextResponse.json({ error: 'Unknown pack' }, { status: 404 });

  const cost = computeBundleTotal(bundle);

  try {
    // Pre-check wallet balance against the full pack total (avoids partial charges).
    const w = await sabiExecute({ sql: `SELECT balance FROM SabiWallet WHERE userId = ? LIMIT 1`, args: [session.id] });
    const balance = Number((w.rows[0] as any)?.balance ?? 0);
    if (balance < cost.total) {
      return NextResponse.json({
        error: 'Insufficient balance for this pack',
        needed: cost.total, balance, shortBy: cost.total - balance,
      }, { status: 402 });
    }

    // Fan out — one order per item, same target URL. Each debits its own slice.
    const created: { serviceId: string; orderId?: string; error?: string }[] = [];
    for (const item of bundle.items) {
      const r = await createSabiOrder({
        userId: session.id,
        serviceId: item.serviceId,
        targetUrl,
        quantity: item.quantity,
        paymentMethod: paymentMethod || 'flutterwave',
      });
      created.push({ serviceId: item.serviceId, orderId: r.orderId, error: r.success ? undefined : r.error });
    }

    const ok = created.filter(c => c.orderId);
    return NextResponse.json({
      success: ok.length > 0,
      bundle: bundle.name,
      ordersCreated: ok.length,
      ordersTotal: bundle.items.length,
      totalKobo: cost.total,
      orders: created,
    });
  } catch (e: any) {
    console.error('[sabi/orders/bundle]', e?.message);
    return NextResponse.json({ error: 'Failed to place pack order' }, { status: 500 });
  }
}
