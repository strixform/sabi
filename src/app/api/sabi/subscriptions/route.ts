import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { listSubscriptions, upsertSubscription } from '@/lib/sabiSubscriptions';
import { getService } from '@/lib/sabiServices';

export const maxDuration = 15;
export const preferredRegion = 'sfo1';

const ALLOWED_INTERVALS = [3, 7, 14, 30];

/** GET /api/sabi/subscriptions — list the user's auto-reorders. */
export async function GET() {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const subs = await listSubscriptions(session.id);
    return NextResponse.json({ success: true, subscriptions: subs });
  } catch (e: any) {
    console.error('[sabi/subscriptions GET]', e?.message);
    return NextResponse.json({ success: true, subscriptions: [] });
  }
}

/** POST /api/sabi/subscriptions — create or update an auto-reorder. */
export async function POST(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { serviceId, targetUrl, quantity, intervalDays,
          audienceGender, audienceLocation, commentGender, commentInstructions } = body;

  if (!serviceId || !targetUrl || !quantity) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!getService(serviceId)) {
    return NextResponse.json({ error: 'Unknown service' }, { status: 400 });
  }
  const interval = Number(intervalDays);
  if (!ALLOWED_INTERVALS.includes(interval)) {
    return NextResponse.json({ error: `Interval must be one of ${ALLOWED_INTERVALS.join(', ')} days` }, { status: 400 });
  }
  const qty = parseInt(quantity);
  if (!Number.isFinite(qty) || qty < 1) {
    return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
  }

  try {
    const sub = await upsertSubscription({
      userId: session.id,
      serviceId,
      targetUrl,
      quantity: qty,
      intervalDays: interval,
      audienceGender: audienceGender ?? null,
      audienceLocation: audienceLocation ?? null,
      commentGender: commentGender ?? null,
      commentInstructions: commentInstructions ?? null,
    });
    return NextResponse.json({ success: true, subscription: sub });
  } catch (e: any) {
    console.error('[sabi/subscriptions POST]', e?.message);
    return NextResponse.json({ error: 'Could not save subscription' }, { status: 500 });
  }
}
