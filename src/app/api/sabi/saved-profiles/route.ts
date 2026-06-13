import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { listSavedProfiles, addSavedProfile, deleteSavedProfile } from '@/lib/sabiSavedProfiles';

export const maxDuration = 15;
export const preferredRegion = 'sfo1';

export async function GET() {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    return NextResponse.json({ success: true, profiles: await listSavedProfiles(session.id) });
  } catch {
    return NextResponse.json({ success: true, profiles: [] });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const label = typeof body.label === 'string' ? body.label.trim().slice(0, 80) : '';
  const url = typeof body.url === 'string' ? body.url.trim().slice(0, 500) : '';
  const platform = typeof body.platform === 'string' ? body.platform.trim().slice(0, 40) : null;
  if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  try { new URL(url); } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }); }

  try {
    const profile = await addSavedProfile(session.id, label || url, url, platform);
    return NextResponse.json({ success: true, profile });
  } catch {
    return NextResponse.json({ error: 'Could not save profile' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const ok = await deleteSavedProfile(id, session.id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
