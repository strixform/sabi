import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { setSubscriptionActive } from '@/lib/sabiSubscriptions';

export const maxDuration = 15;
export const preferredRegion = 'sfo1';

/**
 * PATCH /api/sabi/subscriptions/[id]  body: { active: boolean }
 *   Pause or resume an auto-reorder.
 * DELETE /api/sabi/subscriptions/[id]
 *   Pause (soft-stop) the auto-reorder.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const active = !!body.active;

  const ok = await setSubscriptionActive(id, session.id, active);
  if (!ok) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
  return NextResponse.json({ success: true, active });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const ok = await setSubscriptionActive(id, session.id, false);
  if (!ok) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
