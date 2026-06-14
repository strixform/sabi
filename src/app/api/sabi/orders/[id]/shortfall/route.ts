import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { sabiExecute } from '@/lib/tursoClient';
import { refundSabiWallet } from '@/lib/sabiWallet';
import { getRefillForOrder } from '@/lib/sabiRefills';

export const maxDuration = 15;
export const preferredRegion = 'sfo1';

/**
 * Self-service shortfall refund. If an order under-delivered, the buyer can
 * claim the undelivered portion back to their wallet (one time, proportional).
 *
 * GET  → eligibility + computed shortfall amount
 * POST → process the refund (idempotent via SabiShortfallClaim ledger)
 *
 * Mutually exclusive with a refill: you either get the missing quantity
 * re-delivered (refill) or the money back (shortfall) — not both.
 */
async function ensureLedger() {
  await sabiExecute({
    sql: `CREATE TABLE IF NOT EXISTS SabiShortfallClaim (orderId TEXT PRIMARY KEY, userId TEXT NOT NULL, amountKobo INTEGER NOT NULL, createdAt TEXT NOT NULL)`,
    args: [],
  });
}

async function loadOrder(orderId: string, userId: string) {
  const r = await sabiExecute({
    sql: `SELECT quantity, completedQuantity, totalPrice, platformFee, discountAmount, status FROM SabiOrder WHERE id = ? AND userId = ? LIMIT 1`,
    args: [orderId, userId],
  });
  return (r.rows[0] as any) ?? null;
}

function computeShortfall(o: any): { shortfallQty: number; refundKobo: number; charged: number } {
  const qty = Number(o.quantity || 0);
  const done = Number(o.completedQuantity || 0);
  const shortfallQty = Math.max(0, qty - done);
  const charged = Number(o.totalPrice || 0) + Number(o.platformFee || 0) - Number(o.discountAmount || 0);
  const refundKobo = qty > 0 ? Math.round((shortfallQty / qty) * charged) : 0;
  return { shortfallQty, refundKobo, charged };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const o = await loadOrder(id, session.id);
  if (!o) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  let claimed = false;
  try {
    await ensureLedger();
    const c = await sabiExecute({ sql: `SELECT orderId FROM SabiShortfallClaim WHERE orderId = ? LIMIT 1`, args: [id] });
    claimed = c.rows.length > 0;
  } catch {}
  const refill = await getRefillForOrder(id).catch(() => null);
  const { shortfallQty, refundKobo } = computeShortfall(o);
  const eligible = !claimed && !refill && (o.status === 'completed' || o.status === 'failed') && shortfallQty > 0 && refundKobo > 0;

  return NextResponse.json({ success: true, eligible, claimed, hasRefill: !!refill, shortfallQty, refundKobo, status: o.status });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const o = await loadOrder(id, session.id);
  if (!o) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (o.status !== 'completed' && o.status !== 'failed') {
    return NextResponse.json({ error: 'Shortfall can only be claimed on a finished order.' }, { status: 400 });
  }
  const refill = await getRefillForOrder(id).catch(() => null);
  if (refill) return NextResponse.json({ error: 'A refill was requested for this order — you can claim either a refill or a refund, not both.' }, { status: 400 });

  const { shortfallQty, refundKobo } = computeShortfall(o);
  if (shortfallQty <= 0 || refundKobo <= 0) {
    return NextResponse.json({ error: 'This order was fully delivered — nothing to refund.' }, { status: 400 });
  }

  // Claim the ledger row first (idempotent — PK conflict means already claimed).
  try {
    await ensureLedger();
    await sabiExecute({
      sql: `INSERT INTO SabiShortfallClaim (orderId, userId, amountKobo, createdAt) VALUES (?, ?, ?, ?)`,
      args: [id, session.id, refundKobo, new Date().toISOString()],
    });
  } catch {
    return NextResponse.json({ error: 'Shortfall already claimed for this order.' }, { status: 400 });
  }

  const refund = await refundSabiWallet(session.id, refundKobo, id, `Shortfall refund (${shortfallQty} undelivered)`);
  if (!refund.success) {
    // Roll back the ledger claim so they can retry.
    await sabiExecute({ sql: `DELETE FROM SabiShortfallClaim WHERE orderId = ?`, args: [id] }).catch(() => {});
    return NextResponse.json({ error: 'Refund failed — please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, refundedKobo: refundKobo, shortfallQty });
}
