import { NextRequest, NextResponse } from 'next/server';
import { allowOwnerOrStaff } from '@/lib/sabiStaff';

export const maxDuration = 30;
export const preferredRegion = 'sfo1';

const G360_URL = process.env.GAMERZ360_API_URL || 'https://gamerz360.com';

/**
 * Staff upload a watermarked "correct example" image for a flag. Forwards the file to
 * gamerz360, which watermarks + stores it and returns the URL. POST form-data { file }.
 */
export async function POST(req: NextRequest) {
  const auth = await allowOwnerOrStaff(req);
  if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const token = process.env.SABI_INTEGRATION_TOKEN;
  if (!token) return NextResponse.json({ error: 'Integration not configured' }, { status: 503 });

  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'No file' }, { status: 400 });
    const fwd = new FormData();
    fwd.append('file', file);
    const res = await fetch(`${G360_URL}/api/admin/sabi/flag-example-upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: fwd,
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok || !d?.url) return NextResponse.json({ error: d?.error || 'Upload failed' }, { status: 400 });
    return NextResponse.json({ url: d.url });
  } catch {
    return NextResponse.json({ error: 'Could not reach gamerz360' }, { status: 502 });
  }
}
