/**
 * SABI dedicated (static) virtual account.
 *   GET  — returns the caller's dedicated account (or null).
 *   POST — creates one from the caller's NIN (opt-in; never required).
 *
 * The account is tied to session.id — the same identity the /fund tx_ref credits —
 * so a bank transfer lands in the same wallet as a card top-up.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { getUserVirtualAccount, createUserVirtualAccount, isValidNin } from '@/lib/sabiVirtualAccount';

export const preferredRegion = 'sfo1';
export const maxDuration = 20;

export async function GET() {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const account = await getUserVirtualAccount(session.id);
  return NextResponse.json({ success: true, account });
}

export async function POST(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any = {};
  try { body = await req.json(); } catch { /* empty body */ }
  const nin = (body?.nin ?? '').toString().trim();
  if (!isValidNin(nin)) {
    return NextResponse.json({ error: 'Enter a valid 11-digit NIN' }, { status: 400 });
  }

  const res = await createUserVirtualAccount(session.id, {
    nin,
    email: session.email,
    name: session.name || session.businessName || 'SABI User',
  });
  if (!res.success) {
    return NextResponse.json({ error: res.error || 'Could not create dedicated account' }, { status: 400 });
  }
  return NextResponse.json({ success: true, account: res.account });
}
