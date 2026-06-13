import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getSabiSession } from '@/lib/sabiAuth';

export const preferredRegion = 'sfo1';
export const maxDuration = 15;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

/**
 * POST /api/sabi/upload  (multipart, field "file")
 * Buyer uploads an image (e.g. the "before" screenshot of their page) → Vercel Blob.
 * Returns { url }. Requires a Blob store on the SABI project (BLOB_READ_WRITE_TOKEN).
 */
export async function POST(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Image storage isn't set up yet." }, { status: 503 });
  }

  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'Only JPEG, PNG, WebP or GIF allowed' }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 });

    const ext = EXT[file.type] || 'png';
    const rand = (globalThis.crypto?.randomUUID?.() || `${Date.now()}${Math.random()}`).replace(/-/g, '');
    const blob = await put(`order-start/${session.id}/${rand}.${ext}`, file, { access: 'public', contentType: file.type, addRandomSuffix: true });
    return NextResponse.json({ url: blob.url });
  } catch (e: any) {
    console.error('[sabi/upload]', e?.message);
    return NextResponse.json({ error: 'Upload failed. Please try again.', detail: e?.message?.slice(0, 140) }, { status: 500 });
  }
}
