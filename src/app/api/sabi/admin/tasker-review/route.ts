import { NextRequest, NextResponse } from 'next/server';
import { allowOwnerOrStaff, logStaffAction } from '@/lib/sabiStaff';

export const preferredRegion = 'sfo1';
export const maxDuration = 30;

const G360_URL = process.env.GAMERZ360_API_URL || 'https://gamerz360.com';

/**
 * Tasker audit review — staff proxy to gamerz360 (INTERNAL, staff-only).
 * GET  ?userId= → that tasker's 20% sample; no userId → the review queue.
 * POST { action: 'apply'|'redo', userId, poolIds?, flaggedIds? }
 */
async function forward(method: 'GET' | 'POST', qs: string, body?: any) {
  const token = process.env.SABI_INTEGRATION_TOKEN;
  if (!token) return { status: 503, data: { error: 'Integration not configured' } };
  const res = await fetch(`${G360_URL}/api/admin/sabi/review${qs}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }).catch(() => null);
  if (!res) return { status: 502, data: { error: 'Could not reach gamerz360' } };
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

export async function GET(req: NextRequest) {
  const auth = await allowOwnerOrStaff(req);
  if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const userId = req.nextUrl.searchParams.get('userId');
  const { status, data } = await forward('GET', userId ? `?userId=${encodeURIComponent(userId)}` : '');
  return NextResponse.json(data, { status });
}

export async function POST(req: NextRequest) {
  const auth = await allowOwnerOrStaff(req);
  if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const { status, data } = await forward('POST', '', body);
  if (status < 400) {
    logStaffAction(auth.email || 'owner', `tasker-review:${body.action || '?'}`, String(body.userId || ''), body.action === 'apply' ? `flags:${(body.flaggedIds || []).length}` : '');
  }
  return NextResponse.json(data, { status });
}
