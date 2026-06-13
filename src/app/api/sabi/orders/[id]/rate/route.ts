import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { sabiExecute } from '@/lib/tursoClient';

export const maxDuration = 15;
export const preferredRegion = 'sfo1';

/**
 * Order rating & feedback.
 * GET  /api/sabi/orders/[id]/rate  → current rating for this buyer's order
 * POST /api/sabi/orders/[id]/rate  → save a 1–5 star rating + optional comment
 *
 * Stored on SabiOrder via guarded raw queries (columns `rating` INTEGER and
 * `ratingComment` TEXT may not exist in prod yet — they must never break things).
 *   ALTER TABLE SabiOrder ADD COLUMN rating INTEGER;
 *   ALTER TABLE SabiOrder ADD COLUMN ratingComment TEXT;
 */

async function ownsOrder(orderId: string, userId: string): Promise<{ ok: boolean; status?: string }> {
  const r = await sabiExecute({
    sql: `SELECT status FROM SabiOrder WHERE id = ? AND userId = ? LIMIT 1`,
    args: [orderId, userId],
  });
  if (r.rows.length === 0) return { ok: false };
  return { ok: true, status: (r.rows[0] as any).status };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const own = await ownsOrder(id, session.id);
  if (!own.ok) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  let rating: number | null = null;
  let ratingComment: string | null = null;
  try {
    const r = await sabiExecute({ sql: `SELECT rating, ratingComment FROM SabiOrder WHERE id = ? LIMIT 1`, args: [id] });
    rating = (r.rows[0] as any)?.rating ?? null;
    ratingComment = (r.rows[0] as any)?.ratingComment ?? null;
  } catch { /* columns not added yet */ }

  return NextResponse.json({ success: true, rating, ratingComment, canRate: own.status === 'completed' });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const rating = Number(body.rating);
  const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, 500) : '';

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 });
  }

  const own = await ownsOrder(id, session.id);
  if (!own.ok) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (own.status !== 'completed') {
    return NextResponse.json({ error: 'You can only rate a completed order' }, { status: 400 });
  }

  try {
    await sabiExecute({
      sql: `UPDATE SabiOrder SET rating = ?, ratingComment = ? WHERE id = ?`,
      args: [rating, comment || null, id],
    });
  } catch {
    return NextResponse.json({ error: 'Rating storage not ready yet — please try again shortly.' }, { status: 503 });
  }

  return NextResponse.json({ success: true, rating, ratingComment: comment || null });
}
