export interface SabiService {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  pricePerUnit: number; // in kobo (NGN)
  minQuantity: number;
  maxQuantity: number;
  estimatedDelivery: string;
  taskType: string;
  popularityScore: number;
}

export const SABI_SERVICES: Record<string, SabiService> = {
  // INSTAGRAM SERVICES
  instagram_followers: {
    id: 'instagram_followers',
    name: 'Instagram Followers',
    description: '100% Real & Active Nigerian Instagram Users',
    icon: '📷',
    category: 'instagram',
    pricePerUnit: 60,
    minQuantity: 100,
    maxQuantity: 100000,
    estimatedDelivery: '1-7 days',
    taskType: 'instagram_follow',
    popularityScore: 98,
  },
  instagram_likes: {
    id: 'instagram_likes',
    name: 'Instagram Post Likes',
    description: 'Real engagement from verified Active Nigerian accounts',
    icon: '❤️',
    category: 'instagram',
    pricePerUnit: 80,
    minQuantity: 50,
    maxQuantity: 50000,
    estimatedDelivery: '1-3 days',
    taskType: 'instagram_like',
    popularityScore: 96,
  },
  instagram_comments: {
    id: 'instagram_comments',
    name: 'Instagram Comments',
    description: 'Genuine, contextual comments from Real Nigerian users',
    icon: '💬',
    category: 'instagram',
    pricePerUnit: 180,
    minQuantity: 20,
    maxQuantity: 10000,
    estimatedDelivery: '1-5 days',
    taskType: 'instagram_comment',
    popularityScore: 92,
  },
  instagram_story_views: {
    id: 'instagram_story_views',
    name: 'Instagram Story Views',
    description: 'Real views on your Instagram Stories',
    icon: '👁️',
    category: 'instagram',
    pricePerUnit: 50,
    minQuantity: 100,
    maxQuantity: 50000,
    estimatedDelivery: '1-2 days',
    taskType: 'instagram_story_view',
    popularityScore: 88,
  },
  instagram_shares: {
    id: 'instagram_shares',
    name: 'Instagram Shares',
    description: 'Post shares from real Nigerian accounts',
    icon: '🔄',
    category: 'instagram',
    pricePerUnit: 250,
    minQuantity: 10,
    maxQuantity: 5000,
    estimatedDelivery: '2-5 days',
    taskType: 'instagram_share',
    popularityScore: 85,
  },
  instagram_saves: {
    id: 'instagram_saves',
    name: 'Instagram Saves',
    description: 'Post saves from active Nigerian users',
    icon: '📌',
    category: 'instagram',
    pricePerUnit: 150,
    minQuantity: 20,
    maxQuantity: 10000,
    estimatedDelivery: '1-4 days',
    taskType: 'instagram_save',
    popularityScore: 90,
  },

  // TWITTER/X SERVICES
  twitter_followers: {
    id: 'twitter_followers',
    name: 'Twitter/X Followers',
    description: '100% Real & Active Nigerian X (Twitter) Users',
    icon: '𝕏',
    category: 'twitter',
    pricePerUnit: 55,
    minQuantity: 100,
    maxQuantity: 50000,
    estimatedDelivery: '1-7 days',
    taskType: 'twitter_follow',
    popularityScore: 94,
  },
  twitter_likes: {
    id: 'twitter_likes',
    name: 'Twitter/X Likes',
    description: 'Real likes from verified Nigerian X accounts',
    icon: '❤️',
    category: 'twitter',
    pricePerUnit: 70,
    minQuantity: 50,
    maxQuantity: 50000,
    estimatedDelivery: '1-3 days',
    taskType: 'twitter_like',
    popularityScore: 93,
  },
  twitter_retweets: {
    id: 'twitter_retweets',
    name: 'Twitter/X Retweets',
    description: 'Retweets from real Nigerian X users',
    icon: '🔄',
    category: 'twitter',
    pricePerUnit: 120,
    minQuantity: 20,
    maxQuantity: 20000,
    estimatedDelivery: '1-5 days',
    taskType: 'twitter_retweet',
    popularityScore: 89,
  },
  twitter_replies: {
    id: 'twitter_replies',
    name: 'Twitter/X Replies',
    description: 'Contextual replies from real Nigerian accounts',
    icon: '💬',
    category: 'twitter',
    pricePerUnit: 160,
    minQuantity: 10,
    maxQuantity: 10000,
    estimatedDelivery: '1-5 days',
    taskType: 'twitter_reply',
    popularityScore: 87,
  },
  twitter_views: {
    id: 'twitter_views',
    name: 'Twitter/X Views',
    description: 'Real views on your X tweets',
    icon: '👁️',
    category: 'twitter',
    pricePerUnit: 45,
    minQuantity: 200,
    maxQuantity: 100000,
    estimatedDelivery: '1-2 days',
    taskType: 'twitter_view',
    popularityScore: 91,
  },

  // TIKTOK SERVICES
  tiktok_followers: {
    id: 'tiktok_followers',
    name: 'TikTok Followers',
    description: '100% Real & Active Nigerian TikTok Users',
    icon: '🎵',
    category: 'tiktok',
    pricePerUnit: 70,
    minQuantity: 100,
    maxQuantity: 100000,
    estimatedDelivery: '1-7 days',
    taskType: 'tiktok_follow',
    popularityScore: 97,
  },
  tiktok_likes: {
    id: 'tiktok_likes',
    name: 'TikTok Likes',
    description: 'Real likes from verified Nigerian TikTok accounts',
    icon: '❤️',
    category: 'tiktok',
    pricePerUnit: 65,
    minQuantity: 100,
    maxQuantity: 100000,
    estimatedDelivery: '1-3 days',
    taskType: 'tiktok_like',
    popularityScore: 95,
  },
  tiktok_views: {
    id: 'tiktok_views',
    name: 'TikTok Views',
    description: 'Real views on your TikTok videos',
    icon: '👁️',
    category: 'tiktok',
    pricePerUnit: 40,
    minQuantity: 500,
    maxQuantity: 500000,
    estimatedDelivery: '1-2 days',
    taskType: 'tiktok_view',
    popularityScore: 96,
  },
  tiktok_comments: {
    id: 'tiktok_comments',
    name: 'TikTok Comments',
    description: 'Genuine comments from real Nigerian TikTok users',
    icon: '💬',
    category: 'tiktok',
    pricePerUnit: 150,
    minQuantity: 20,
    maxQuantity: 10000,
    estimatedDelivery: '1-5 days',
    taskType: 'tiktok_comment',
    popularityScore: 88,
  },
  tiktok_shares: {
    id: 'tiktok_shares',
    name: 'TikTok Shares',
    description: 'Video shares from real Nigerian accounts',
    icon: '🔄',
    category: 'tiktok',
    pricePerUnit: 200,
    minQuantity: 10,
    maxQuantity: 5000,
    estimatedDelivery: '2-5 days',
    taskType: 'tiktok_share',
    popularityScore: 84,
  },

  // YOUTUBE SERVICES
  youtube_subscribers: {
    id: 'youtube_subscribers',
    name: 'YouTube Subscribers',
    description: '100% Real & Active Nigerian YouTube Users',
    icon: '▶️',
    category: 'youtube',
    pricePerUnit: 80,
    minQuantity: 50,
    maxQuantity: 50000,
    estimatedDelivery: '1-7 days',
    taskType: 'youtube_subscribe',
    popularityScore: 91,
  },
  youtube_views: {
    id: 'youtube_views',
    name: 'YouTube Views',
    description: 'Real views on your YouTube videos',
    icon: '👁️',
    category: 'youtube',
    pricePerUnit: 50,
    minQuantity: 500,
    maxQuantity: 500000,
    estimatedDelivery: '1-2 days',
    taskType: 'youtube_view',
    popularityScore: 93,
  },
  youtube_likes: {
    id: 'youtube_likes',
    name: 'YouTube Likes',
    description: 'Real likes from verified Nigerian YouTube accounts',
    icon: '👍',
    category: 'youtube',
    pricePerUnit: 100,
    minQuantity: 50,
    maxQuantity: 50000,
    estimatedDelivery: '1-3 days',
    taskType: 'youtube_like',
    popularityScore: 89,
  },
  youtube_comments: {
    id: 'youtube_comments',
    name: 'YouTube Comments',
    description: 'Genuine comments from real Nigerian users',
    icon: '💬',
    category: 'youtube',
    pricePerUnit: 180,
    minQuantity: 10,
    maxQuantity: 5000,
    estimatedDelivery: '1-5 days',
    taskType: 'youtube_comment',
    popularityScore: 85,
  },
  youtube_shares: {
    id: 'youtube_shares',
    name: 'YouTube Shares',
    description: 'Video shares from real Nigerian accounts',
    icon: '🔄',
    category: 'youtube',
    pricePerUnit: 220,
    minQuantity: 10,
    maxQuantity: 5000,
    estimatedDelivery: '2-5 days',
    taskType: 'youtube_share',
    popularityScore: 82,
  },

  // FACEBOOK SERVICES
  facebook_likes: {
    id: 'facebook_likes',
    name: 'Facebook Likes',
    description: 'Real likes from verified Nigerian Facebook accounts',
    icon: '👍',
    category: 'facebook',
    pricePerUnit: 85,
    minQuantity: 50,
    maxQuantity: 50000,
    estimatedDelivery: '1-3 days',
    taskType: 'facebook_like',
    popularityScore: 86,
  },
  facebook_shares: {
    id: 'facebook_shares',
    name: 'Facebook Shares',
    description: 'Post shares from real Nigerian accounts',
    icon: '🔄',
    category: 'facebook',
    pricePerUnit: 200,
    minQuantity: 10,
    maxQuantity: 5000,
    estimatedDelivery: '2-5 days',
    taskType: 'facebook_share',
    popularityScore: 80,
  },
  facebook_comments: {
    id: 'facebook_comments',
    name: 'Facebook Comments',
    description: 'Contextual comments from real Nigerian users',
    icon: '💬',
    category: 'facebook',
    pricePerUnit: 170,
    minQuantity: 10,
    maxQuantity: 10000,
    estimatedDelivery: '1-5 days',
    taskType: 'facebook_comment',
    popularityScore: 83,
  },

  // GENERAL SERVICES
  website_traffic: {
    id: 'website_traffic',
    name: 'Website Traffic',
    description: 'Real visits to your website from Nigerian users',
    icon: '🌐',
    category: 'general',
    pricePerUnit: 80,
    minQuantity: 100,
    maxQuantity: 100000,
    estimatedDelivery: '1-3 days',
    taskType: 'website_visit',
    popularityScore: 87,
  },
  email_signups: {
    id: 'email_signups',
    name: 'Email Signups',
    description: 'Real email signups from genuine Nigerian users',
    icon: '📧',
    category: 'general',
    pricePerUnit: 300,
    minQuantity: 10,
    maxQuantity: 10000,
    estimatedDelivery: '1-7 days',
    taskType: 'email_signup',
    popularityScore: 79,
  },
  app_installs: {
    id: 'app_installs',
    name: 'App Installs',
    description: 'Real app installs from Nigerian users',
    icon: '📱',
    category: 'general',
    pricePerUnit: 250,
    minQuantity: 10,
    maxQuantity: 10000,
    estimatedDelivery: '1-5 days',
    taskType: 'app_install',
    popularityScore: 81,
  },
  survey_responses: {
    id: 'survey_responses',
    name: 'Survey Responses',
    description: 'Genuine survey responses from real Nigerian users',
    icon: '📝',
    category: 'general',
    pricePerUnit: 400,
    minQuantity: 5,
    maxQuantity: 5000,
    estimatedDelivery: '2-7 days',
    taskType: 'survey_response',
    popularityScore: 75,
  },
};

export function getService(serviceId: string): SabiService | null {
  return SABI_SERVICES[serviceId] || null;
}

export function getAllServices(): SabiService[] {
  return Object.values(SABI_SERVICES);
}

export function calculatePrice(serviceId: string, quantity: number): number | null {
  const service = getService(serviceId);
  if (!service) return null;

  if (quantity < service.minQuantity || quantity > service.maxQuantity) {
    return null;
  }

  const basePrice = service.pricePerUnit * quantity;
  const platformFee = Math.ceil(basePrice * 0.15);
  return basePrice + platformFee;
}

export function validateOrder(
  serviceId: string,
  quantity: number,
  targetUrl: string
): { valid: boolean; error?: string } {
  const service = getService(serviceId);

  if (!service) {
    return { valid: false, error: 'Service not found' };
  }

  if (quantity < service.minQuantity) {
    return { valid: false, error: `Minimum quantity is ${service.minQuantity}` };
  }

  if (quantity > service.maxQuantity) {
    return { valid: false, error: `Maximum quantity is ${service.maxQuantity}` };
  }

  if (!targetUrl || targetUrl.trim().length === 0) {
    return { valid: false, error: 'Target URL is required' };
  }

  try {
    new URL(targetUrl);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  return { valid: true };
}
