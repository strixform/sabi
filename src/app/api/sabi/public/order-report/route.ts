import { NextRequest, NextResponse } from 'next/server';
import { sabiExecute } from '@/lib/tursoClient';
import { verifyOrderToken } from '@/lib/shareToken';

export const maxDuration = 15;
export const preferredRegion = 'sfo1';

const G360_URL = process.env.GAMERZ360_API_URL || 'https://gamerz360.com';

/**
 * GET /api/sabi/public/order-report?token=x   (PUBLIC — no login)
 * Token-verified read-only report: order summary + the real proof receipts.
 * Exposes only non-sensitive fields (no buyer email, no pricing).
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim() || '';
  const orderId = verifyOrderToken(token);
  if (!orderId) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });

  try {
    const o = await sabiExecute({
      sql: `SELECT serviceType, quantity, status, completedQuantity, completionPercentage, createdAt
            FROM SabiOrder WHERE id = ? LIMIT 1`,
      args: [orderId],
    });
    if (o.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const r = o.rows[0] as any;

    let proofs: any[] = [];
    let meta = { total: 0, approved: 0, withScreenshot: 0 };
    const tok = process.env.SABI_INTEGRATION_TOKEN;
    if (tok) {
      const pr = await fetch(`${G360_URL}/api/admin/sabi/order-proofs?sabiOrderId=${encodeURIComponent(orderId)}`, {
        headers: { 'Authorization': `Bearer ${tok}`, 'User-Agent': 'Mozilla/5.0 (compatible; SABI-Integration/1.0)' },
      }).catch(() => null);
      if (pr?.ok) {
        const d = await pr.json();
        proofs = d.proofs || [];
        meta = { total: d.total || 0, approved: d.approved || 0, withScreenshot: d.withScreenshot || 0 };
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        idShort: orderId.substring(0, 8),
        serviceType: r.serviceType,
        quantity: Number(r.quantity),
        status: r.status,
        completedQuantity: Number(r.completedQuantity || 0),
        completionPercentage: Number(r.completionPercentage || 0),
        createdAt: r.createdAt,
      },
      meta,
      proofs,
    });
  } catch (e: any) {
    console.error('[sabi/public/order-report]', e?.message);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}
