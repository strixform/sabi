import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { debitSabiWallet } from '@/lib/sabiWallet';
import { createPartnership, getPartnershipForUser, PARTNERSHIP_FEE_KOBO } from '@/lib/sabiPartnership';

export const maxDuration = 20;
export const preferredRegion = 'sfo1';

/**
 * GET  /api/sabi/partnership  → the user's partnership (if any) + the fee
 * POST /api/sabi/partnership  → apply: pays the fee from wallet, creates a build
 *   request. body { brandName, domain?, contactPhone?, notes? }
 */
export async function GET() {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const partnership = await getPartnershipForUser(session.id).catch(() => null);
  return NextResponse.json({ success: true, partnership, feeKobo: PARTNERSHIP_FEE_KOBO });
}

export async function POST(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await getPartnershipForUser(session.id).catch(() => null);
  if (existing && existing.status !== 'cancelled') {
    return NextResponse.json({ error: 'You already have a partnership in progress.' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const brandName = typeof body.brandName === 'string' ? body.brandName.trim().slice(0, 80) : '';
  const domain = typeof body.domain === 'string' ? body.domain.trim().slice(0, 120) : '';
  const contactPhone = typeof body.contactPhone === 'string' ? body.contactPhone.trim().slice(0, 30) : '';
  const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 500) : '';
  if (!brandName) return NextResponse.json({ error: 'Brand name is required.' }, { status: 400 });

  // Charge the one-time partnership fee from the wallet.
  const debit = await debitSabiWallet(session.id, PARTNERSHIP_FEE_KOBO, `partnership:${session.id}`);
  if (!debit.success) {
    return NextResponse.json({
      error: debit.error || 'Insufficient wallet balance.',
      needsFunding: true,
      feeKobo: PARTNERSHIP_FEE_KOBO,
    }, { status: 400 });
  }

  const partnership = await createPartnership({
    userId: session.id, brandName, domain, contactPhone, notes, paidKobo: PARTNERSHIP_FEE_KOBO,
  });

  // Notify admin (fire-and-forget).
  import('@/lib/email').then((m: any) => {
    if (m.sendPartnershipAdminEmail) m.sendPartnershipAdminEmail(brandName, domain, contactPhone, notes).catch(() => {});
  }).catch(() => {});

  return NextResponse.json({ success: true, partnership });
}
