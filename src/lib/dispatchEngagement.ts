import crypto from 'crypto';
import { sabiExecute } from './tursoClient';
import type { AutoEngagementPlatform } from './autoEngagement';

/**
 * Phase 2 dispatch — turn an Auto Engagement package/post into standard SABI work
 * orders so the EXISTING pipeline carries them: the process-scheduled cron pushes each
 * to gamers360, taskers do the action and upload proof, the staff console reviews them.
 *
 * These are WORK-ONLY orders: pricePerUnit/totalPrice/platformFee = 0. The buyer already
 * paid the whole package up front (escrow), and gamers360 pays taskers from ITS points
 * economy per serviceType — not from SABI's price. Keeping the price at 0 means the
 * refund crons touch NO buyer money for them (the package alone owns the escrow and does
 * per-post release/refund in Phase 3), so there's zero interaction with the refund system.
 *
 * Each order is tagged customRef = "ae:<packageId>:<postId|follow>:<action>" so Phase 3
 * can find a post's orders and reconcile completion → release.
 */

type Actions = { follow: string; like: string; comment: string; commentLike: string };

// SABI service ids per platform. gamers360 maps these to its taskTypes + pays taskers.
const SERVICE_IDS: Record<AutoEngagementPlatform, Actions> = {
  instagram: { follow: 'ig_followers',        like: 'ig_likes',      comment: 'ig_comments',      commentLike: 'instagram_post_comment_likes' },
  tiktok:    { follow: 'tiktok_followers',    like: 'tiktok_likes',  comment: 'tiktok_comments',  commentLike: 'tiktok_post_comment_likes' },
  youtube:   { follow: 'youtube_subscribers', like: 'youtube_likes', comment: 'youtube_comments', commentLike: 'youtube_post_comment_likes' },
  twitter:   { follow: 'twitter_followers',   like: 'twitter_likes', comment: 'twitter_replies',  commentLike: 'twitter_post_comment_likes' },
  facebook:  { follow: 'fb_followers',        like: 'fb_post_likes', comment: 'fb_comments',      commentLike: 'facebook_post_comment_likes' },
};

export interface DispatchPackage {
  id: string;
  userId: string;
  platform: AutoEngagementPlatform;
  profileUrl: string;
  engagersPerPost: number;
  mixComment: boolean;
  mixCommentLikes: number;
}

async function insertWorkOrder(o: {
  userId: string; serviceType: string; targetUrl: string; quantity: number; customRef: string;
}): Promise<string | null> {
  if (!o.quantity || o.quantity <= 0) return null;
  const id = `aeo_${crypto.randomUUID()}`;
  // status 'pending' → the process-scheduled cron picks it up and pushes to gamers360.
  await sabiExecute({
    sql: `INSERT INTO SabiOrder
            (id, userId, serviceType, targetUrl, quantity, pricePerUnit, totalPrice, platformFee,
             paymentMethod, orderedVia, status, completedQuantity, completionPercentage,
             discountAmount, refundedAmount, customRef, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, 0, 0, 0, 'wallet', 'web', 'pending', 0, 0, 0, 0, ?, datetime('now'), datetime('now'))`,
    args: [id, o.userId, o.serviceType, o.targetUrl, o.quantity, o.customRef],
  });
  return id;
}

/** One-time: taskers follow the buyer's profile. Called when the package is bought. */
export async function dispatchEngagementFollow(pkg: DispatchPackage): Promise<string | null> {
  const ids = SERVICE_IDS[pkg.platform];
  if (!ids) return null;
  return insertWorkOrder({
    userId: pkg.userId,
    serviceType: ids.follow,
    targetUrl: pkg.profileUrl,
    quantity: pkg.engagersPerPost,
    customRef: `ae:${pkg.id}:follow:follow`,
  });
}

/** Per post: like + (comment) + (like other comments). Called when a post link is added. */
export async function dispatchEngagementRound(
  pkg: DispatchPackage,
  post: { id: string; postUrl: string },
): Promise<string[]> {
  const ids = SERVICE_IDS[pkg.platform];
  if (!ids) return [];
  const tag = (a: string) => `ae:${pkg.id}:${post.id}:${a}`;
  const created: (string | null)[] = [];

  created.push(await insertWorkOrder({ userId: pkg.userId, serviceType: ids.like, targetUrl: post.postUrl, quantity: pkg.engagersPerPost, customRef: tag('like') }));
  if (pkg.mixComment) {
    created.push(await insertWorkOrder({ userId: pkg.userId, serviceType: ids.comment, targetUrl: post.postUrl, quantity: pkg.engagersPerPost, customRef: tag('comment') }));
  }
  if (pkg.mixCommentLikes > 0) {
    created.push(await insertWorkOrder({ userId: pkg.userId, serviceType: ids.commentLike, targetUrl: post.postUrl, quantity: pkg.engagersPerPost * pkg.mixCommentLikes, customRef: tag('commentlike') }));
  }
  return created.filter((x): x is string => !!x);
}
