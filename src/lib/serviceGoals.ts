import { SERVICES_CATALOG, PLATFORMS, type Service } from '@/lib/servicesCatalog';

/**
 * Goal-based taxonomy layered ON TOP of the catalog's platform categories. Buyers think in
 * OUTCOMES ("I want reviews", "I want traffic"), not platforms — so we classify each service by
 * its action into a goal, and give every goal a plain-English "smart helper" that explains what it
 * does AND how it drives sales. This makes the 125-service catalog easy to browse without editing
 * a single service object.
 */
export interface ServiceGoal {
  id: string;
  label: string;
  emoji: string;
  tagline: string;          // one-liner shown on the chip/card
  helper: string;           // the smart explainer — how this drives sales
  match: RegExp;            // matched against service.action
}

const MUSIC_PLATFORMS = [PLATFORMS.SPOTIFY, PLATFORMS.AUDIOMACK, PLATFORMS.BOOMPLAY, PLATFORMS.APPLE_MUSIC];

// Priority order matters — a service is placed in the FIRST goal it matches.
export const SERVICE_GOALS: ServiceGoal[] = [
  { id: 'reviews', label: 'Reviews & Reputation', emoji: '⭐', tagline: 'Build trust that sells',
    helper: 'Five-star reviews and ratings make buyers trust you before they even message. More trust = more sales. Perfect for businesses, apps, online stores and service providers — paste your Google, Maps, or store link and real people leave genuine reviews.',
    match: /review|rating/i },
  { id: 'app', label: 'App Growth', emoji: '📲', tagline: 'Rank higher, get installs',
    helper: 'Real installs and 5-star ratings push your app up the store rankings, so more people discover and download it. The more installs and good ratings, the more the store recommends you.',
    match: /install/i },
  { id: 'traffic', label: 'Traffic & Clicks', emoji: '🌐', tagline: 'Turn clicks into customers',
    helper: 'Send real Nigerian visitors to your website, landing page or bio link so more eyes become real customers and sign-ups. Great for launches, promos and anything you want people to actually visit.',
    match: /visit|signup|sign up|click|traffic|shazam/i },
  { id: 'votes', label: 'Votes & Surveys', emoji: '🗳️', tagline: 'Win polls, get feedback',
    helper: 'Win that poll, contest or award with real votes — or let real people complete your surveys for honest feedback. Ideal for competitions, brand research and community decisions.',
    match: /vote|survey|poll/i },
  { id: 'audience', label: 'Grow My Audience', emoji: '👥', tagline: 'Look established, gain trust',
    helper: 'A bigger, real following makes your brand look established — people follow crowds and buy from names they recognise. Grow followers, subscribers, members and connections across every platform.',
    match: /follow|subscrib|member|connection|contact|newsletter|page like/i },
  { id: 'engagement', label: 'Get Engagement', emoji: '❤️', tagline: 'Social proof that converts',
    helper: 'Likes and comments tell the algorithm your post is hot, so it reaches more people — and the social proof makes new buyers comfortable to order. The fastest way to make a post look popular and trusted.',
    match: /like|comment|share|react|save|retweet|repost|repl|repin|quote|bookmark|favorit/i },
  { id: 'music', label: 'Music Promotion', emoji: '🎵', tagline: 'Climb the charts',
    helper: 'Get real plays, saves and playlist adds so your song climbs the charts and reaches new fans. Built for artists pushing a new release on Audiomack, Boomplay, Spotify and Apple Music.',
    match: /playlist|sound/i },
  { id: 'views', label: 'Views & Plays', emoji: '▶️', tagline: 'Get seen, go viral',
    helper: 'High view and play counts signal popularity and push your content to more feeds — the first step to going viral and getting discovered. Great for videos, reels, stories and live streams.',
    match: /view|play|watch|listen/i },
  { id: 'content', label: 'Content & UGC', emoji: '🎬', tagline: 'Real creators, real content',
    helper: 'Get authentic user-generated content and posts from real Nigerian creators — unboxings, reviews, reels and voiceovers — to use across your marketing.',
    match: /ugc|status|post$/i },
];

const OTHER: ServiceGoal = { id: 'other', label: 'More Services', emoji: '✨', tagline: 'Everything else', helper: 'A mix of specialised services — search or browse by platform to find exactly what you need.', match: /.^/ };

export function goalForService(s: Service): ServiceGoal {
  if (MUSIC_PLATFORMS.includes(s.category)) {
    // Plays/saves on music platforms belong to Music promotion, not generic Views.
    if (/play|save|favorit|playlist|listen/i.test(s.action)) return SERVICE_GOALS.find(g => g.id === 'music')!;
  }
  for (const g of SERVICE_GOALS) if (g.match.test(s.action)) return g;
  return OTHER;
}

/** How many services fall under each goal (for chips + empty-state hiding). */
export function goalsWithCounts(): { goal: ServiceGoal; count: number }[] {
  const counts = new Map<string, number>();
  for (const s of SERVICES_CATALOG) { const g = goalForService(s); counts.set(g.id, (counts.get(g.id) || 0) + 1); }
  return [...SERVICE_GOALS, OTHER]
    .map(goal => ({ goal, count: counts.get(goal.id) || 0 }))
    .filter(x => x.count > 0);
}

/** The most order-worthy services to pin as "Popular / Quick order". */
export const POPULAR_SERVICE_IDS = ['ig_followers', 'ig_likes', 'tiktok_followers', 'tiktok_views', 'ig_comments', 'youtube_subscribers', 'google_business_review', 'website_visit'];
