import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSabiSession } from '@/lib/sabiAuth';
import { sabiExecute } from '@/lib/tursoClient';

export const maxDuration = 30;
export const preferredRegion = 'sfo1';

/**
 * Buyer submits the link to a newly-published post on an active package (the "hybrid"
 * link side — taskers also follow/notify). Atomically claims the next post slot so a
 * double-submit can't exceed postsTotal. Phase 2 will dispatch the engagement round.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const postUrl = String(body.postUrl || '').trim();
  try {
    const h = new URL(postUrl.includes('://') ? postUrl : `https://${postUrl}`).hostname;
    if (!h.includes('.')) throw new Error('bad');
  } catch {
    return NextResponse.json({ error: 'Paste a valid link to the post' }, { status: 400 });
  }

  // Verify ownership + capacity.
  const pk = await sabiExecute({
    sql: `SELECT userId, platform, profileUrl, engagersPerPost, mixComment, mixCommentLikes,
                 postsTotal, postsSubmitted, status
          FROM SabiEngagementPackage WHERE id = ? LIMIT 1`,
    args: [id],
  }).catch(() => ({ rows: [] as any[] }));
  const pkg = (pk.rows as any[])[0];
  if (!pkg || String(pkg.userId) !== session.id) return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  if (pkg.status !== 'active') return NextResponse.json({ error: 'This package is closed' }, { status: 400 });
  if (Number(pkg.postsSubmitted) >= Number(pkg.postsTotal)) {
    return NextResponse.json({ error: 'All posts for this package have been used' }, { status: 400 });
  }

  // Atomically claim the next slot — only succeeds if there's still room, so two rapid
  // submits can't both push past postsTotal.
  const claim = await sabiExecute({
    sql: `UPDATE SabiEngagementPackage
          SET postsSubmitted = postsSubmitted + 1, updatedAt = datetime('now')
          WHERE id = ? AND postsSubmitted < postsTotal AND status = 'active'`,
    args: [id],
  }).catch(() => ({ rowsAffected: 0 } as any));
  if (Number((claim as any).rowsAffected ?? 0) !== 1) {
    return NextResponse.json({ error: 'No post slots left' }, { status: 409 });
  }

  const idx = Number(pkg.postsSubmitted) + 1;
  const postId = `aeps_${crypto.randomUUID()}`;
  await sabiExecute({
    sql: `INSERT INTO SabiEngagementPost (id, packageId, userId, postUrl, idx, status, createdAt)
          VALUES (?, ?, ?, ?, ?, 'engaging', datetime('now'))`,
    args: [postId, id, session.id, postUrl, idx],
  });

  // Phase 2: dispatch the engagement round (like + comment + comment-likes) for this
  // post to gamers360 taskers. Best-effort — the slot is already claimed and the post
  // recorded; a dispatch hiccup can be re-driven by reconcile.
  try {
    const { dispatchEngagementRound } = await import('@/lib/dispatchEngagement');
    await dispatchEngagementRound(
      {
        id, userId: session.id, platform: pkg.platform,
        profileUrl: pkg.profileUrl, engagersPerPost: Number(pkg.engagersPerPost),
        mixComment: Number(pkg.mixComment) === 1, mixCommentLikes: Number(pkg.mixCommentLikes),
      },
      { id: postId, postUrl },
    );
  } catch (e: any) {
    console.error('[ae-add-post] round dispatch failed (non-fatal):', e?.message);
  }

  return NextResponse.json({ ok: true, postId, idx, remaining: Number(pkg.postsTotal) - idx });
}
