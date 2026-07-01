import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { getSabiOrders } from '@/lib/sabiOrderEngine';
import { isActiveTeamMember } from '@/lib/sabiTeam';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'sfo1';
export const maxDuration = 20;

// GET ?ownerId — read-only orders of an owner's account, IF the signed-in user is
// an active team member (viewer) of that owner. Never exposes another account's
// orders without an accepted membership.
export async function GET(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const ownerId = (req.nextUrl.searchParams.get('ownerId') || '').trim();
  if (!ownerId) return NextResponse.json({ error: 'ownerId required' }, { status: 400 });

  if (!(await isActiveTeamMember(session.id, ownerId))) {
    return NextResponse.json({ error: 'You do not have access to this account.' }, { status: 403 });
  }

  const orders = await getSabiOrders(ownerId, 100);
  return NextResponse.json({ success: true, readOnly: true, orders });
}
