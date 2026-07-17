import { NextRequest, NextResponse } from 'next/server';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
import { sabiExecute } from '@/lib/tursoClient';
import { getAccountDiscountPct, setAccountDiscountPct } from '@/lib/sabiDiscount';

export const preferredRegion = 'sfo1';
export const dynamic = 'force-dynamic';

async function findUser(q: string) {
  const r = await sabiExecute({ sql: `SELECT id, email, name FROM SabiUser WHERE id = ? OR LOWER(email) = LOWER(?) LIMIT 1`, args: [q, q] }).catch(() => ({ rows: [] as any[] }));
  return (r.rows as any[])[0];
}

/** Admin: view / set a user's per-account API discount %. */
export async function GET(req: NextRequest) {
  if (!await checkSabiAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const q = req.nextUrl.searchParams.get('user') || '';
  const u = await findUser(q);
  if (!u) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ user: { id: u.id, email: u.email, name: u.name }, discountPct: await getAccountDiscountPct(u.id) });
}

export async function POST(req: NextRequest) {
  if (!await checkSabiAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({} as any));
  const u = await findUser(String(body.user || body.userId || ''));
  if (!u) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const r = await setAccountDiscountPct(u.id, Number(body.pct));
  if (!r.ok) return NextResponse.json({ error: 'Could not update' }, { status: 500 });
  return NextResponse.json({ success: true, user: { id: u.id, email: u.email, name: u.name }, discountPct: await getAccountDiscountPct(u.id) });
}
