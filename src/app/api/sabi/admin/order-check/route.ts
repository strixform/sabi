import { NextRequest, NextResponse } from 'next/server';
import { allowOwnerOrStaff, logStaffAction } from '@/lib/sabiStaff';
import { sabiExecute } from '@/lib/tursoClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;
export const preferredRegion = 'sfo1';

/**
 * Staff marks an order's proofs fully checked → it leaves the to-check list and
 * moves to "Checked Orders". POST { orderId, checked?: boolean (default true) }.
 * Guarded so a missing column (pre-migration) never hard-fails.
 */
export async function POST(req: NextRequest) {
  const auth = await allowOwnerOrStaff(req);
  if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const orderId = String(body.orderId || '');
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });
  const checked = body.checked === false ? 0 : 1;

  try {
    await sabiExecute({
      sql: `UPDATE SabiOrder SET staffChecked = ?, staffCheckedAt = ?, staffCheckedBy = ? WHERE id = ?`,
      args: [checked, checked ? new Date().toISOString() : null, checked ? (auth.email || 'staff') : null, orderId],
    });
    logStaffAction(auth.email || 'owner', checked ? 'order:checked' : 'order:unchecked', orderId, '');
    return NextResponse.json({ success: true, checked: !!checked });
  } catch (e: any) {
    return NextResponse.json({ error: 'Could not update — run migrate-columns.' }, { status: 500 });
  }
}
