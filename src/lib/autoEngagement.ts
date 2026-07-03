import { ACTION_PRICE_KOBO, PLATFORM_FEE_RATE, VAT_RATE } from './servicesCatalog';

/**
 * Auto Engagement package — pure pricing + config (no DB).
 *
 * A buyer funds engagement for their NEXT N posts on their own profile. Taskers
 * follow the profile (once) and, each time the buyer publishes a post, run an
 * "engagement round" on it: like + comment + like-other-comments. Money is escrowed
 * up front and released per post as each round is completed and staff-approved.
 *
 * Price is composed from the SAME per-action base prices as the rest of the catalog,
 * so Auto Engagement never drifts from single-service pricing:
 *   perEngagerPerPost = Likes + Comments + Comment Likes
 *   base = engagers × (Follow once + posts × perEngagerPerPost)
 *   grand = base + platform fee + VAT
 */

export const AUTO_ENGAGEMENT_PLATFORMS = ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook'] as const;
export type AutoEngagementPlatform = (typeof AUTO_ENGAGEMENT_PLATFORMS)[number];

export const AE_LIMITS = {
  minPosts: 1,
  maxPosts: 10,
  minEngagers: 5,
  maxEngagers: 500,
} as const;

// What each tasker does per post. Defaults mirror the note (like + comment +
// like-other-comments); a buyer can dial the comment/comment-like mix down but a
// like is always included so the round is meaningful.
export interface EngagementMix {
  like: boolean;          // always true — the baseline action
  comment: boolean;
  commentLikes: number;   // how many OTHER comments each tasker likes (0 = off)
}

export const DEFAULT_MIX: EngagementMix = { like: true, comment: true, commentLikes: 2 };

export interface AutoEngagementConfig {
  platform: AutoEngagementPlatform;
  posts: number;          // N future posts covered
  engagersPerPost: number;// taskers engaging each post (drives like/comment volume)
  mix: EngagementMix;
}

export interface AutoEngagementPricing {
  followKobo: number;         // one-time follow, per engager
  perEngagerPerPostKobo: number;
  baseKobo: number;           // tasker budget (our cost)
  platformFeeKobo: number;
  vatKobo: number;
  totalKobo: number;          // what the buyer pays
  // Breakdown for the UI
  posts: number;
  engagersPerPost: number;
  totalActions: number;       // follows + all per-post actions across the package
}

function priceOf(action: string): number {
  return ACTION_PRICE_KOBO[action] || 0;
}

export function clampConfig(c: AutoEngagementConfig): AutoEngagementConfig {
  const posts = Math.max(AE_LIMITS.minPosts, Math.min(AE_LIMITS.maxPosts, Math.round(c.posts || 0)));
  const engagersPerPost = Math.max(AE_LIMITS.minEngagers, Math.min(AE_LIMITS.maxEngagers, Math.round(c.engagersPerPost || 0)));
  const commentLikes = Math.max(0, Math.min(10, Math.round(c.mix?.commentLikes ?? 0)));
  return {
    platform: c.platform,
    posts,
    engagersPerPost,
    mix: { like: true, comment: !!c.mix?.comment, commentLikes },
  };
}

export function priceAutoEngagement(input: AutoEngagementConfig): AutoEngagementPricing {
  const c = clampConfig(input);

  const followKobo = priceOf('Followers'); // one-time follow of the buyer's profile
  const perEngagerPerPostKobo =
    priceOf('Likes') +
    (c.mix.comment ? priceOf('Comments') : 0) +
    c.mix.commentLikes * priceOf('Comment Likes');

  // base = per engager: one follow + (posts × per-post actions)
  const baseKobo = c.engagersPerPost * (followKobo + c.posts * perEngagerPerPostKobo);
  const platformFeeKobo = Math.round(baseKobo * PLATFORM_FEE_RATE);
  const vatKobo = Math.round(baseKobo * VAT_RATE);
  const totalKobo = baseKobo + platformFeeKobo + vatKobo;

  // actions per engager: 1 follow + posts × (1 like + maybe 1 comment + commentLikes)
  const perEngagerActions = 1 + c.posts * (1 + (c.mix.comment ? 1 : 0) + c.mix.commentLikes);
  const totalActions = c.engagersPerPost * perEngagerActions;

  return {
    followKobo,
    perEngagerPerPostKobo,
    baseKobo,
    platformFeeKobo,
    vatKobo,
    totalKobo,
    posts: c.posts,
    engagersPerPost: c.engagersPerPost,
    totalActions,
  };
}

/** The share of a package's escrow attributable to ONE completed post — used to
 *  release escrow per round instead of all-at-the-end. The one-time follow cost is
 *  amortised across the posts so the sum of per-post releases equals the base. */
export function postReleaseKobo(pricing: AutoEngagementPricing): number {
  if (pricing.posts <= 0) return 0;
  return Math.round(pricing.baseKobo / pricing.posts);
}
