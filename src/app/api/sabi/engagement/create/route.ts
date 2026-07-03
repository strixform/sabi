import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSabiSession } from '@/lib/sabiAuth';
import { debitSabiWallet } from '@/lib/sabiWallet';
import { sabiExecute } from '@/lib/tursoClient';
import {
  priceAutoEngagement, clampConfig, AUTO_ENGAGEMENT_PLATFORMS,
  type AutoEngagementPlatform,
} from '@/lib/autoEngagement';
import { getRateLimitKey, checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const maxDuration = 30;
export const preferredRegion = 'sfo1';

/**
 * Buy an Auto Engagement package. Prices SERVER-SIDE (never trusts the client total),
 * debits the buyer's wallet up front (escrow held by the platform), and records the
 * package. Tasker dispatch happens in Phase 2 when posts are submitted.
 */
export async function POST(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = await checkRateLimit(getRateLimitKey(req, 'ae-create'), 10, 60000);
  if (!rl.allowed) return rateLimitResponse(10, rl.resetTime);

  const body = await req.json().catch(() => ({}));
  const platform = String(body.platform || '') as AutoEngagementPlatform;
  if (!AUTO_ENGAGEMENT_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
  }
  const profileUrl = String(body.profileUrl || '').trim();
  try {
    const h = new URL(profileUrl.includes('://') ? profileUrl : `https://${profileUrl}`).hostname;
    if (!h.includes('.')) throw new Error('bad');
  } catch {
    return NextResponse.json({ error: 'Paste a valid link to your profile' }, { status: 400 });
  }

  // Server-side price from the clamped config — the client total is ignored.
  const cfg = clampConfig({
    platform,
    posts: Number(body.posts),
    engagersPerPost: Number(body.engagersPerPost),
    mix: { like: true, comment: !!body.comment, commentLikes: Number(body.commentLikes) || 0 },
  });
  const pricing = priceAutoEngagement(cfg);
  if (pricing.totalKobo <= 0) return NextResponse.json({ error: 'Invalid package' }, { status: 400 });

  const id = `aep_${crypto.randomUUID()}`;

  // Escrow: debit the buyer up front. Money is held by the platform and released to
  // taskers per post as each round completes and is staff-approved.
  const debit = await debitSabiWallet(session.id, pricing.totalKobo, id);
  if (!debit.success) {
    return NextResponse.json({ error: debit.error || 'Insufficient balance', needTopUp: true }, { status: 402 });
  }

  try {
    await sabiExecute({
      sql: `INSERT INTO SabiEngagementPackage
              (id, userId, platform, profileUrl, postsTotal, engagersPerPost, mixComment, mixCommentLikes,
               amountKobo, baseKobo, postReleaseKobo, postsSubmitted, postsCompleted, releasedKobo, status, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 'active', datetime('now'), datetime('now'))`,
      args: [
        id, session.id, platform, profileUrl, cfg.posts, cfg.engagersPerPost,
        cfg.mix.comment ? 1 : 0, cfg.mix.commentLikes,
        pricing.totalKobo, pricing.baseKobo,
        Math.round(pricing.baseKobo / cfg.posts),
      ],
    });
  } catch (e: any) {
    // Insert failed after debiting — refund so the buyer is never charged without a package.
    const { creditSabiWallet } = await import('@/lib/sabiWallet');
    await creditSabiWallet(session.id, pricing.totalKobo, `ae-refund-${id}`).catch(() => {});
    return NextResponse.json({ error: 'Could not create package — you were not charged' }, { status: 500 });
  }

  // Phase 2: dispatch the one-time "follow" work order to gamers360 taskers. Best-effort
  // — a dispatch hiccup must not fail a purchase the buyer already paid for; the follow
  // can be re-dispatched by reconcile if it didn't land.
  try {
    const { dispatchEngagementFollow } = await import('@/lib/dispatchEngagement');
    await dispatchEngagementFollow({
      id, userId: session.id, platform,
      profileUrl, engagersPerPost: cfg.engagersPerPost,
      mixComment: cfg.mix.comment, mixCommentLikes: cfg.mix.commentLikes,
    });
  } catch (e: any) {
    console.error('[ae-create] follow dispatch failed (non-fatal):', e?.message);
  }

  return NextResponse.json({
    ok: true,
    packageId: id,
    chargedKobo: pricing.totalKobo,
    posts: cfg.posts,
    engagersPerPost: cfg.engagersPerPost,
  });
}
