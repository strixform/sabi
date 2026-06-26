import { NextRequest, NextResponse } from 'next/server';
import { allowOwnerOrStaff } from '@/lib/sabiStaff';
import { sabiExecute } from '@/lib/tursoClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;
export const preferredRegion = 'sfo1';

const SLA_HOURS = 72;

/**
 * SABI operations health — refund & escrow at a glance:
 * orders about to hit the partial-refund SLA, recent auto-refunds, and UGC escrow
 * currently held vs paid out. Read-only (owner/staff).
 */
export async function GET(req: NextRequest) {
  if (!(await allowOwnerOrStaff(req)).ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const cutoff = new Date(Date.now() - SLA_HOURS * 3600 * 1000).toISOString();
  const q = async (sql: string, args: any[] = []) => {
    try { return (await sabiExecute({ sql, args })).rows as any[]; } catch { return []; }
  };

  // Orders that will be partial-refunded on the next SLA sweep.
  const pending = await q(
    `SELECT id, serviceType, quantity, COALESCE(completedQuantity,0) AS done, createdAt
     FROM SabiOrder
     WHERE status IN ('executing','processing') AND createdAt < ?
       AND (dripChainId IS NULL OR dripChainId = '')
       AND COALESCE(completedQuantity,0) < quantity
     ORDER BY createdAt ASC LIMIT 50`,
    [cutoff],
  );

  // Recent auto-refunds (no-region failures + SLA partial-refunds carry refundReason).
  const refunds = await q(
    `SELECT id, serviceType, status, refundReason, createdAt
     FROM SabiOrder
     WHERE refundReason IS NOT NULL AND refundReason != '' AND status IN ('failed','completed')
     ORDER BY createdAt DESC LIMIT 25`,
  );

  // UGC escrow held vs paid.
  const escrow = await q(`SELECT status, COUNT(*) AS n, COALESCE(SUM(escrowKobo),0) AS kobo FROM UGCBooking GROUP BY status`);
  const ACTIVE = ['pending_creator', 'negotiating', 'accepted', 'delivered'];
  const heldKobo = escrow.filter(e => ACTIVE.includes(e.status)).reduce((s, e) => s + Number(e.kobo || 0), 0);
  const paidKobo = escrow.filter(e => e.status === 'completed').reduce((s, e) => s + Number(e.kobo || 0), 0);

  const ngn = (k: number) => Math.round((Number(k) || 0) / 100);

  return NextResponse.json({
    success: true,
    pendingPartialRefunds: {
      total: pending.length,
      sample: pending.map(o => ({ id: String(o.id), serviceType: o.serviceType, done: Number(o.done), quantity: Number(o.quantity), createdAt: o.createdAt })),
    },
    recentRefunds: refunds.map(o => ({ id: String(o.id), serviceType: o.serviceType, status: o.status, reason: o.refundReason, createdAt: o.createdAt })),
    escrow: { heldNaira: ngn(heldKobo), paidNaira: ngn(paidKobo), active: escrow.filter(e => ACTIVE.includes(e.status)).reduce((s, e) => s + Number(e.n || 0), 0) },
  });
}
