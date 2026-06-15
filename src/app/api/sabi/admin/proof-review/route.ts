import { NextRequest, NextResponse } from 'next/server';
import { allowOwnerOrStaff, setProofReview, getProofReviews, logStaffAction } from '@/lib/sabiStaff';

export const preferredRegion = 'sfo1';
export const maxDuration = 15;

// GET ?orderIds=a,b,c — proof verdicts for a set of orders (owner or staff).
export async function GET(req: NextRequest) {
  const { ok } = await allowOwnerOrStaff(req);
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const ids = (req.nextUrl.searchParams.get('orderIds') || '').split(',').map(s => s.trim()).filter(Boolean);
  const reviews = await getProofReviews(ids);
  return NextResponse.json({ reviews });
}

// POST { orderId, status: 'verified'|'flagged', note } — record a coherence verdict.
export async function POST(req: NextRequest) {
  const { ok, email } = await allowOwnerOrStaff(req);
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { orderId, status, note } = await req.json().catch(() => ({}));
  if (!orderId || (status !== 'verified' && status !== 'flagged')) {
    return NextResponse.json({ error: 'orderId and status (verified|flagged) required' }, { status: 400 });
  }
  const reviewer = email || 'owner';
  await setProofReview(String(orderId), status, String(note || ''), reviewer);
  await logStaffAction(reviewer, `proof:${status}`, String(orderId), String(note || '').slice(0, 200));
  return NextResponse.json({ success: true });
}
