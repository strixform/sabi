/**
 * SEO landing pages — one high-intent page per money keyword (e.g. "buy Instagram
 * followers in Nigeria"). Each maps to a real service in the catalog so the CTA deep-
 * links straight into the order flow (/sabi/order?serviceId=…). Rendered by
 * src/app/buy/[slug]/page.tsx and listed on /buy. Add an entry here and it flows into
 * the page, the hub and the sitemap automatically.
 *
 * Copy stays honest to the brand — real Nigerians, no bots, targetable, naira pricing —
 * and never quotes hardcoded prices (they live on the order page, and could drift).
 */

export interface Landing {
  slug: string;        // URL slug under /buy/
  serviceId: string;   // catalog service id for the order deep-link
  platform: string;    // display platform, e.g. "Instagram"
  unit: string;        // lowercase noun, e.g. "followers"
  h1: string;
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  intro: string;
  benefits: string[];
  faqs?: { q: string; a: string }[];
}

function baseFaqs(platform: string, unit: string): { q: string; a: string }[] {
  return [
    {
      q: `Are these ${platform} ${unit} from real people?`,
      a: `Yes. Every order is fulfilled by verified real Nigerians — never bots. That's why the engagement holds and your account stays safe: no algorithm was gamed.`,
    },
    {
      q: `How fast do my ${platform} ${unit} start?`,
      a: `Most orders begin within minutes of placing them, and delivery is paced naturally so your growth looks organic rather than a suspicious overnight spike.`,
    },
    {
      q: `Do I need to give my password?`,
      a: `Never. We only need the public link to your ${platform} profile or post — no password and no login access, ever.`,
    },
    {
      q: `Can I target a specific audience?`,
      a: `Yes. You can target by Nigerian state, city and gender, so your ${unit} come from the audience that actually matters to your content or brand.`,
    },
    {
      q: `What do I pay in, and is there a refund if it under-delivers?`,
      a: `Pricing is in Nigerian naira — fund your wallet once and order instantly. If a campaign under-delivers, the undelivered remainder is automatically refunded: you only pay for what's delivered.`,
    },
  ];
}

export const LANDINGS: Landing[] = [
  {
    slug: 'instagram-followers-nigeria',
    serviceId: 'ig_followers',
    platform: 'Instagram',
    unit: 'followers',
    h1: 'Buy Instagram Followers in Nigeria',
    tagline: 'Real, active Nigerian followers — not bots that vanish next week.',
    metaTitle: 'Buy Instagram Followers in Nigeria — Real & Active',
    metaDescription:
      'Grow your Instagram with real Nigerian followers. Target by state, city and gender, orders start within minutes, and you only pay for what\'s delivered. See live naira pricing.',
    keywords:
      'buy Instagram followers Nigeria, real Instagram followers Naira, grow Instagram Nigeria, Instagram followers Lagos, active Nigerian followers',
    intro:
      'Real followers are the difference between a page that looks abandoned and one people trust on sight. SABI grows your Instagram with verified Nigerians who actually see and engage with your posts.',
    benefits: [
      'Real, active Nigerian accounts — no bots, no drops that get your page flagged.',
      'Target by state, city and gender so your follower base matches your real audience.',
      'Orders start within minutes and grow at a natural, safe pace.',
      'Only pay for what\'s delivered — the remainder is auto-refunded if a campaign under-delivers.',
    ],
  },
  {
    slug: 'instagram-likes-nigeria',
    serviceId: 'ig_likes',
    platform: 'Instagram',
    unit: 'likes',
    h1: 'Buy Instagram Likes in Nigeria',
    tagline: 'Real likes from Nigerians that push your post into Explore.',
    metaTitle: 'Buy Instagram Likes in Nigeria — Real Nigerian Likes',
    metaDescription:
      'Get real Instagram likes from active Nigerians. Fast start, natural pacing, target by state and gender, and you only pay for what\'s delivered. See live naira pricing.',
    keywords:
      'buy Instagram likes Nigeria, real Instagram likes Naira, Instagram post likes Nigeria, boost Instagram post Nigeria',
    intro:
      'Likes in the first hour tell Instagram your post is worth pushing. SABI delivers real likes from Nigerians so your content earns the early momentum that triggers reach.',
    benefits: [
      'Real Nigerian likes that signal quality to the Instagram algorithm.',
      'Fast start on new posts — where early engagement matters most.',
      'Natural pacing that looks organic, never a suspicious spike.',
      'Only pay for what\'s delivered, with auto-refund on any shortfall.',
    ],
  },
  {
    slug: 'instagram-reel-views-nigeria',
    serviceId: 'ig_reel_views',
    platform: 'Instagram',
    unit: 'views',
    h1: 'Buy Instagram Reel Views in Nigeria',
    tagline: 'Trigger the Reels algorithm with real early views.',
    metaTitle: 'Buy Instagram Reel Views in Nigeria — Real Views',
    metaDescription:
      'Get real Instagram Reel views from Nigerians and trigger the algorithm to push your Reel further. Fast start, natural pacing, live naira pricing. Only pay for what\'s delivered.',
    keywords:
      'buy Instagram reel views Nigeria, Instagram reel views Naira, boost Instagram reel Nigeria, real reel views',
    intro:
      'Reels are Instagram\'s cash cow, and view velocity in the first couple of hours decides how far a Reel travels. SABI gets real Nigerian eyes on your Reel early so the algorithm does the rest.',
    benefits: [
      'Real views that build the early velocity Reels are ranked on.',
      'Kick-start new Reels in the critical first two hours.',
      'Delivered by real Nigerians, so watch behaviour looks genuine.',
      'Only pay for what\'s delivered — remainder auto-refunded.',
    ],
  },
  {
    slug: 'tiktok-followers-nigeria',
    serviceId: 'tiktok_followers',
    platform: 'TikTok',
    unit: 'followers',
    h1: 'Buy TikTok Followers in Nigeria',
    tagline: 'Real Nigerian followers that make your profile worth following.',
    metaTitle: 'Buy TikTok Followers in Nigeria — Real & Active',
    metaDescription:
      'Grow your TikTok with real Nigerian followers. Target by state, city and gender, fast start, natural pacing, live naira pricing. You only pay for what\'s delivered.',
    keywords:
      'buy TikTok followers Nigeria, real TikTok followers Naira, grow TikTok Nigeria, TikTok followers Lagos',
    intro:
      'On TikTok, follower count is social proof that decides whether a new viewer taps follow or scrolls on. SABI builds it with real Nigerians who engage, not empty bot accounts.',
    benefits: [
      'Real, active Nigerian followers — the kind that actually watch your next video.',
      'Target by state, city and gender to match your niche.',
      'Fast start with natural, safe pacing.',
      'Only pay for what\'s delivered, with auto-refund on any shortfall.',
    ],
  },
  {
    slug: 'tiktok-views-nigeria',
    serviceId: 'tiktok_views',
    platform: 'TikTok',
    unit: 'views',
    h1: 'Buy TikTok Views in Nigeria',
    tagline: 'Real views that push your video onto the For You Page.',
    metaTitle: 'Buy TikTok Views in Nigeria — Real TikTok Views',
    metaDescription:
      'Get real TikTok video views from Nigerians and give your video the velocity the For You Page rewards. Fast start, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy TikTok views Nigeria, TikTok video views Naira, TikTok FYP Nigeria, boost TikTok video Nigeria',
    intro:
      'The For You Page rewards videos that gather views fast. SABI gives your TikTok the early view velocity from real Nigerians that tells the algorithm it deserves a bigger audience.',
    benefits: [
      'Real views that build For You Page momentum.',
      'Fast start where the first hours count most.',
      'From real Nigerians, so watch patterns look genuine.',
      'Only pay for what\'s delivered — remainder auto-refunded.',
    ],
  },
  {
    slug: 'tiktok-likes-nigeria',
    serviceId: 'tiktok_likes',
    platform: 'TikTok',
    unit: 'likes',
    h1: 'Buy TikTok Likes in Nigeria',
    tagline: 'Real Nigerian likes that boost your engagement rate.',
    metaTitle: 'Buy TikTok Likes in Nigeria — Real Nigerian Likes',
    metaDescription:
      'Get real TikTok likes from active Nigerians to lift your engagement rate and reach. Fast start, natural pacing, live naira pricing. Only pay for what\'s delivered.',
    keywords:
      'buy TikTok likes Nigeria, real TikTok likes Naira, boost TikTok engagement Nigeria',
    intro:
      'A strong like-to-view ratio tells TikTok your video resonates. SABI delivers real likes from Nigerians so your engagement rate — and your reach — climbs.',
    benefits: [
      'Real Nigerian likes that lift your engagement ratio.',
      'Fast start on fresh uploads.',
      'Natural pacing that stays under the radar.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'youtube-subscribers-nigeria',
    serviceId: 'youtube_subscribers',
    platform: 'YouTube',
    unit: 'subscribers',
    h1: 'Buy YouTube Subscribers in Nigeria',
    tagline: 'Real Nigerian subscribers on the road to monetisation.',
    metaTitle: 'Buy YouTube Subscribers in Nigeria — Real & Active',
    metaDescription:
      'Grow your channel with real Nigerian YouTube subscribers. Natural pacing, no password needed, live naira pricing. You only pay for what\'s delivered.',
    keywords:
      'buy YouTube subscribers Nigeria, real YouTube subscribers Naira, grow YouTube channel Nigeria, YouTube monetisation Nigeria',
    intro:
      'Subscribers are the credibility that makes new viewers stay — and a milestone on the way to monetisation. SABI grows yours with real Nigerians, not throwaway accounts that get purged.',
    benefits: [
      'Real, active Nigerian subscribers that stick.',
      'Natural pacing that protects your channel\'s standing.',
      'No password needed — just your channel link.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'youtube-views-nigeria',
    serviceId: 'youtube_views',
    platform: 'YouTube',
    unit: 'views',
    h1: 'Buy YouTube Views in Nigeria',
    tagline: 'Real views that build a video\'s momentum and ranking.',
    metaTitle: 'Buy YouTube Views in Nigeria — Real YouTube Views',
    metaDescription:
      'Get real YouTube views from Nigerians to build momentum and improve ranking. Natural pacing, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy YouTube views Nigeria, real YouTube views Naira, rank YouTube video Nigeria, boost YouTube Nigeria',
    intro:
      'View count is the first thing a viewer judges a video by, and momentum feeds YouTube\'s ranking. SABI gets real Nigerian views on your video so it earns both.',
    benefits: [
      'Real views that build credibility and ranking signals.',
      'Natural pacing that looks organic.',
      'Delivered by real Nigerians.',
      'Only pay for what\'s delivered — remainder auto-refunded.',
    ],
  },
  {
    slug: 'youtube-watch-time-nigeria',
    serviceId: 'youtube_watch_time',
    platform: 'YouTube',
    unit: 'watch time',
    h1: 'Buy YouTube Watch Time in Nigeria',
    tagline: 'Real watch hours toward your monetisation threshold.',
    metaTitle: 'Buy YouTube Watch Time in Nigeria — Real Watch Hours',
    metaDescription:
      'Build real YouTube watch time from Nigerians toward the 4,000-hour monetisation threshold. Natural pacing, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy YouTube watch time Nigeria, YouTube watch hours Naira, 4000 watch hours Nigeria, YouTube monetisation watch time',
    intro:
      'Watch time is the hardest part of the monetisation bar to clear. SABI adds real Nigerian watch hours to your videos so you close the gap to 4,000 hours faster.',
    benefits: [
      'Real watch hours from Nigerians that count toward monetisation.',
      'Natural pacing that protects channel health.',
      'No password needed — just your video links.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'twitter-followers-nigeria',
    serviceId: 'twitter_followers',
    platform: 'X (Twitter)',
    unit: 'followers',
    h1: 'Buy X (Twitter) Followers in Nigeria',
    tagline: 'Real Nigerian followers that make your profile credible.',
    metaTitle: 'Buy Twitter (X) Followers in Nigeria — Real & Active',
    metaDescription:
      'Grow your X (Twitter) profile with real Nigerian followers. Fast start, natural pacing, no password, live naira pricing. You only pay for what\'s delivered.',
    keywords:
      'buy Twitter followers Nigeria, buy X followers Nigeria, real Twitter followers Naira, grow Twitter Nigeria',
    intro:
      'On X, follower count sets your credibility before anyone reads a single post. SABI builds it with real Nigerians so your profile is taken seriously from the first glance.',
    benefits: [
      'Real, active Nigerian followers — no empty egg accounts.',
      'Fast start with natural, safe pacing.',
      'No password needed — just your handle.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'facebook-page-likes-nigeria',
    serviceId: 'fb_page_likes',
    platform: 'Facebook',
    unit: 'page likes',
    h1: 'Buy Facebook Page Likes in Nigeria',
    tagline: 'Real Nigerian page likes that build instant trust.',
    metaTitle: 'Buy Facebook Page Likes in Nigeria — Real & Active',
    metaDescription:
      'Grow your Facebook Page with real Nigerian likes and followers. Target by state and gender, natural pacing, live naira pricing. Only pay for what\'s delivered.',
    keywords:
      'buy Facebook page likes Nigeria, real Facebook likes Naira, grow Facebook page Nigeria, Facebook followers Nigeria',
    intro:
      'A Facebook Page with real likes reads as an established business; an empty one reads as a scam. SABI builds your Page\'s credibility with real Nigerians.',
    benefits: [
      'Real Nigerian page likes that build instant trust.',
      'Target by state, city and gender for local relevance.',
      'Natural pacing that looks organic.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'spotify-plays-nigeria',
    serviceId: 'spotify_plays',
    platform: 'Spotify',
    unit: 'plays',
    h1: 'Buy Spotify Plays in Nigeria',
    tagline: 'Real streams that build your track\'s momentum.',
    metaTitle: 'Buy Spotify Plays in Nigeria — Real Streams',
    metaDescription:
      'Get real Spotify plays from Nigerian listeners to build streaming momentum for your track. Natural pacing, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy Spotify plays Nigeria, Spotify streams Naira, promote music Nigeria, boost Spotify track Nigeria',
    intro:
      'Streaming numbers are the proof labels, playlisters and fans look at first. SABI builds your track\'s momentum with real Nigerian plays.',
    benefits: [
      'Real plays that build streaming credibility.',
      'Natural pacing that looks like genuine discovery.',
      'No password needed — just your track link.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'telegram-members-nigeria',
    serviceId: 'telegram_followers',
    platform: 'Telegram',
    unit: 'members',
    h1: 'Buy Telegram Members in Nigeria',
    tagline: 'Real Nigerian members that make your channel look alive.',
    metaTitle: 'Buy Telegram Members in Nigeria — Real Members',
    metaDescription:
      'Grow your Telegram channel with real Nigerian members. Fast start, natural pacing, no password, live naira pricing. You only pay for what\'s delivered.',
    keywords:
      'buy Telegram members Nigeria, Telegram channel members Naira, grow Telegram Nigeria, Telegram subscribers Nigeria',
    intro:
      'Nobody joins an empty Telegram channel. SABI seeds yours with real Nigerian members so new visitors see an active community worth joining.',
    benefits: [
      'Real Nigerian members that make your channel credible.',
      'Fast start with natural pacing.',
      'No password needed — just your channel link.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'twitch-followers-nigeria',
    serviceId: 'twitch_followers',
    platform: 'Twitch',
    unit: 'followers',
    h1: 'Buy Twitch Followers in Nigeria',
    tagline: 'Real followers on the road to Affiliate.',
    metaTitle: 'Buy Twitch Followers in Nigeria — Real & Active',
    metaDescription:
      'Grow your Twitch channel with real Nigerian followers toward Affiliate. Fast start, natural pacing, live naira pricing. You only pay for what\'s delivered.',
    keywords:
      'buy Twitch followers Nigeria, real Twitch followers Naira, grow Twitch Nigeria, Twitch affiliate Nigeria',
    intro:
      'Follower count is the credibility a new viewer weighs before sticking around — and a step toward Affiliate. SABI grows yours with real Nigerians.',
    benefits: [
      'Real Nigerian followers that make your channel look established.',
      'Progress toward Affiliate requirements.',
      'Fast start with natural pacing.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },

  /* ---------------------------- Tier 2 ---------------------------- */

  {
    slug: 'instagram-comments-nigeria',
    serviceId: 'ig_comments',
    platform: 'Instagram',
    unit: 'comments',
    h1: 'Buy Instagram Comments in Nigeria',
    tagline: 'Real Nigerian comments that make a post look like a conversation.',
    metaTitle: 'Buy Instagram Comments in Nigeria — Real Comments',
    metaDescription:
      'Get real, relevant Instagram comments from Nigerians. Genuine sentences — never one-word spam. Fast start, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy Instagram comments Nigeria, real Instagram comments Naira, custom Instagram comments Nigeria, boost Instagram engagement',
    intro:
      'Comments are the engagement Instagram values most — and the social proof that convinces new visitors your content is worth their time. SABI delivers real, on-topic comments from Nigerians, not one-word filler.',
    benefits: [
      'Real, relevant comments — genuine sentences, never "nice 🔥" spam.',
      'The highest-weighted engagement signal on Instagram.',
      'Delivered by real Nigerians who read the post.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'instagram-story-views-nigeria',
    serviceId: 'ig_story_views',
    platform: 'Instagram',
    unit: 'story views',
    h1: 'Buy Instagram Story Views in Nigeria',
    tagline: 'Real story views that keep you at the front of the tray.',
    metaTitle: 'Buy Instagram Story Views in Nigeria — Real Views',
    metaDescription:
      'Get real Instagram Story views from Nigerians. Higher story views push you toward the front of followers\' trays. Fast start, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy Instagram story views Nigeria, Instagram story views Naira, boost Instagram story Nigeria',
    intro:
      'Story view counts are public proof of an active, watched account — and they influence where you sit in your followers\' story tray. SABI gets real Nigerians watching yours.',
    benefits: [
      'Real story views that signal an active, watched account.',
      'Fast start within your story\'s 24-hour window.',
      'From real Nigerians, so the numbers hold up.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'tiktok-comments-nigeria',
    serviceId: 'tiktok_comments',
    platform: 'TikTok',
    unit: 'comments',
    h1: 'Buy TikTok Comments in Nigeria',
    tagline: 'Real Nigerian comments that spark a comment section.',
    metaTitle: 'Buy TikTok Comments in Nigeria — Real Comments',
    metaDescription:
      'Get real, relevant TikTok comments from Nigerians to spark conversation and lift engagement. Fast start, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy TikTok comments Nigeria, real TikTok comments Naira, boost TikTok engagement Nigeria',
    intro:
      'A busy comment section keeps viewers on your video longer and tells TikTok it\'s worth pushing. SABI seeds yours with real, on-topic comments from Nigerians.',
    benefits: [
      'Real, relevant comments that start conversation.',
      'Longer watch sessions as viewers read replies.',
      'Delivered by real Nigerians who watched the video.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'tiktok-shares-nigeria',
    serviceId: 'tiktok_shares',
    platform: 'TikTok',
    unit: 'shares',
    h1: 'Buy TikTok Shares in Nigeria',
    tagline: 'Real shares — the strongest signal your video is spreading.',
    metaTitle: 'Buy TikTok Shares in Nigeria — Real Shares',
    metaDescription:
      'Get real TikTok shares from Nigerians. Shares are the strongest "this is worth spreading" signal to the For You Page. Fast start, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy TikTok shares Nigeria, TikTok shares Naira, boost TikTok reach Nigeria, TikTok FYP shares',
    intro:
      'Of every TikTok signal, shares carry the most weight — they tell the algorithm your video is worth spreading beyond your own audience. SABI delivers real shares from Nigerians.',
    benefits: [
      'Shares — the highest-value For You Page signal.',
      'Extends reach past your current followers.',
      'From real Nigerians, so it reads as genuine.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'youtube-likes-nigeria',
    serviceId: 'youtube_likes',
    platform: 'YouTube',
    unit: 'likes',
    h1: 'Buy YouTube Likes in Nigeria',
    tagline: 'Real Nigerian likes that build a video\'s credibility.',
    metaTitle: 'Buy YouTube Likes in Nigeria — Real Video Likes',
    metaDescription:
      'Get real YouTube likes from Nigerians to build credibility and ranking signals. Natural pacing, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy YouTube likes Nigeria, real YouTube likes Naira, boost YouTube video Nigeria',
    intro:
      'A healthy like count reassures new viewers and feeds YouTube\'s sense that a video resonates. SABI adds real likes from Nigerians to your videos.',
    benefits: [
      'Real likes that build credibility and ranking signals.',
      'Natural pacing that looks organic.',
      'Delivered by real Nigerians.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'youtube-comments-nigeria',
    serviceId: 'youtube_comments',
    platform: 'YouTube',
    unit: 'comments',
    h1: 'Buy YouTube Comments in Nigeria',
    tagline: 'Real Nigerian comments that get a video talked about.',
    metaTitle: 'Buy YouTube Comments in Nigeria — Real Comments',
    metaDescription:
      'Get real, relevant YouTube comments from Nigerians to build discussion and social proof. Natural pacing, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy YouTube comments Nigeria, real YouTube comments Naira, YouTube engagement Nigeria',
    intro:
      'An active comment thread signals a video worth watching and keeps viewers on the page. SABI delivers real, on-topic comments from Nigerians.',
    benefits: [
      'Real, relevant comments — genuine sentences, not spam.',
      'Discussion that keeps viewers engaged longer.',
      'Delivered by real Nigerians who watched.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'twitter-likes-nigeria',
    serviceId: 'twitter_likes',
    platform: 'X (Twitter)',
    unit: 'likes',
    h1: 'Buy X (Twitter) Likes in Nigeria',
    tagline: 'Real Nigerian likes that give your posts instant traction.',
    metaTitle: 'Buy Twitter (X) Likes in Nigeria — Real Likes',
    metaDescription:
      'Get real X (Twitter) likes from Nigerians to give your posts early traction and reach. Fast start, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy Twitter likes Nigeria, buy X likes Nigeria, real Twitter likes Naira, boost tweet Nigeria',
    intro:
      'Early likes decide whether a post gains momentum or sinks in the timeline. SABI gives your posts real likes from Nigerians when it counts.',
    benefits: [
      'Real likes that build early post traction.',
      'Fast start in the critical first minutes.',
      'From real Nigerians, never bots.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'twitter-retweets-nigeria',
    serviceId: 'twitter_retweets',
    platform: 'X (Twitter)',
    unit: 'retweets',
    h1: 'Buy X (Twitter) Retweets in Nigeria',
    tagline: 'Real reposts that push your post beyond your followers.',
    metaTitle: 'Buy Twitter (X) Retweets in Nigeria — Real Reposts',
    metaDescription:
      'Get real X (Twitter) retweets from Nigerians to spread your post beyond your own audience. Fast start, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy Twitter retweets Nigeria, buy X reposts Nigeria, real retweets Naira, boost tweet reach Nigeria',
    intro:
      'Retweets are how a post escapes your own follower list and reaches new timelines. SABI delivers real reposts from Nigerians to widen your reach.',
    benefits: [
      'Real reposts that extend reach past your followers.',
      'Fast start to build momentum quickly.',
      'From real Nigerians, so it looks organic.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'twitter-views-nigeria',
    serviceId: 'twitter_views',
    platform: 'X (Twitter)',
    unit: 'views',
    h1: 'Buy X (Twitter) Views in Nigeria',
    tagline: 'Real post views that build visible traction.',
    metaTitle: 'Buy Twitter (X) Views in Nigeria — Real Post Views',
    metaDescription:
      'Get real X (Twitter) post views from Nigerians to build visible traction on your posts. Fast start, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy Twitter views Nigeria, buy X views Nigeria, tweet views Naira, boost tweet views Nigeria',
    intro:
      'View counts are the first number people see under a post — high ones invite more engagement. SABI gets real Nigerians viewing yours.',
    benefits: [
      'Real views that make posts look worth engaging.',
      'Fast start where early numbers matter.',
      'From real Nigerians, not bots.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'facebook-followers-nigeria',
    serviceId: 'fb_followers',
    platform: 'Facebook',
    unit: 'followers',
    h1: 'Buy Facebook Followers in Nigeria',
    tagline: 'Real Nigerian followers for your profile or public figure page.',
    metaTitle: 'Buy Facebook Followers in Nigeria — Real & Active',
    metaDescription:
      'Grow your Facebook profile with real Nigerian followers. Target by state and gender, natural pacing, live naira pricing. You only pay for what\'s delivered.',
    keywords:
      'buy Facebook followers Nigeria, real Facebook followers Naira, grow Facebook profile Nigeria',
    intro:
      'Follower count is the credibility a new visitor weighs before following you back. SABI builds yours with real Nigerians who actually see your posts.',
    benefits: [
      'Real, active Nigerian followers.',
      'Target by state, city and gender.',
      'Natural pacing that looks organic.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'facebook-post-likes-nigeria',
    serviceId: 'fb_post_likes',
    platform: 'Facebook',
    unit: 'post likes',
    h1: 'Buy Facebook Post Likes in Nigeria',
    tagline: 'Real Nigerian reactions that give your post social proof.',
    metaTitle: 'Buy Facebook Post Likes in Nigeria — Real Likes',
    metaDescription:
      'Get real Facebook post likes and reactions from Nigerians to build social proof and reach. Fast start, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy Facebook post likes Nigeria, Facebook reactions Naira, boost Facebook post Nigeria',
    intro:
      'Reactions are the proof that decides whether a scroller stops on your post. SABI delivers real likes from Nigerians so yours earns the pause.',
    benefits: [
      'Real Nigerian likes and reactions.',
      'Fast start on new posts.',
      'Natural pacing that looks genuine.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'spotify-followers-nigeria',
    serviceId: 'spotify_followers',
    platform: 'Spotify',
    unit: 'followers',
    h1: 'Buy Spotify Followers in Nigeria',
    tagline: 'Real followers that make your artist profile credible.',
    metaTitle: 'Buy Spotify Followers in Nigeria — Real Followers',
    metaDescription:
      'Grow your Spotify artist profile with real Nigerian followers. Natural pacing, no password, live naira pricing. You only pay for what\'s delivered.',
    keywords:
      'buy Spotify followers Nigeria, real Spotify followers Naira, grow Spotify artist Nigeria, promote music Nigeria',
    intro:
      'Follower count is the first credibility signal a listener, curator or label sees on your Spotify profile. SABI builds it with real Nigerians.',
    benefits: [
      'Real followers that build artist credibility.',
      'Natural pacing that looks like real discovery.',
      'No password needed — just your profile link.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'snapchat-followers-nigeria',
    serviceId: 'snapchat_followers',
    platform: 'Snapchat',
    unit: 'followers',
    h1: 'Buy Snapchat Followers in Nigeria',
    tagline: 'Real Nigerian followers for your Snapchat.',
    metaTitle: 'Buy Snapchat Followers in Nigeria — Real & Active',
    metaDescription:
      'Grow your Snapchat with real Nigerian followers. Fast start, natural pacing, live naira pricing. You only pay for what\'s delivered.',
    keywords:
      'buy Snapchat followers Nigeria, real Snapchat followers Naira, grow Snapchat Nigeria',
    intro:
      'A bigger Snapchat following means more eyes on every story and spotlight you post. SABI grows yours with real Nigerians.',
    benefits: [
      'Real, active Nigerian followers.',
      'More reach on every story and spotlight.',
      'Fast start with natural pacing.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'threads-followers-nigeria',
    serviceId: 'threads_followers',
    platform: 'Threads',
    unit: 'followers',
    h1: 'Buy Threads Followers in Nigeria',
    tagline: 'Real Nigerian followers for your Threads profile.',
    metaTitle: 'Buy Threads Followers in Nigeria — Real & Active',
    metaDescription:
      'Grow your Threads profile with real Nigerian followers. Fast start, natural pacing, live naira pricing. You only pay for what\'s delivered.',
    keywords:
      'buy Threads followers Nigeria, real Threads followers Naira, grow Threads Nigeria',
    intro:
      'Threads rewards active, followed profiles with more reach. SABI builds your following with real Nigerians who engage.',
    benefits: [
      'Real, active Nigerian followers.',
      'Fast start with natural pacing.',
      'From real people, never bots.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'telegram-post-views-nigeria',
    serviceId: 'telegram_views',
    platform: 'Telegram',
    unit: 'post views',
    h1: 'Buy Telegram Post Views in Nigeria',
    tagline: 'Real views that make your channel posts look widely read.',
    metaTitle: 'Buy Telegram Post Views in Nigeria — Real Views',
    metaDescription:
      'Get real Telegram post views from Nigerians so your channel posts look widely read. Fast start, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy Telegram post views Nigeria, Telegram views Naira, boost Telegram channel Nigeria',
    intro:
      'View counts under your Telegram posts are public proof of a channel worth following. SABI gets real Nigerians viewing your posts.',
    benefits: [
      'Real post views that signal an active channel.',
      'Fast start on new posts.',
      'From real Nigerians, so the counts hold up.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'twitch-views-nigeria',
    serviceId: 'twitch_views',
    platform: 'Twitch',
    unit: 'views',
    h1: 'Buy Twitch Views in Nigeria',
    tagline: 'Real stream views that lift you up the directory.',
    metaTitle: 'Buy Twitch Views in Nigeria — Real Stream Views',
    metaDescription:
      'Get real Twitch stream views from Nigerians to climb the directory and get discovered. Fast start, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy Twitch views Nigeria, Twitch stream views Naira, grow Twitch Nigeria, Twitch viewers Nigeria',
    intro:
      'Higher live viewer counts push your stream up the category directory where new viewers actually find you. SABI gets real Nigerians watching.',
    benefits: [
      'Real stream views that lift you in the directory.',
      'More discovery from category browsers.',
      'From real Nigerians, never bots.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'pinterest-followers-nigeria',
    serviceId: 'pinterest_followers',
    platform: 'Pinterest',
    unit: 'followers',
    h1: 'Buy Pinterest Followers in Nigeria',
    tagline: 'Real Nigerian followers that widen your pins\' reach.',
    metaTitle: 'Buy Pinterest Followers in Nigeria — Real & Active',
    metaDescription:
      'Grow your Pinterest with real Nigerian followers so your pins reach further. Natural pacing, live naira pricing. You only pay for what\'s delivered.',
    keywords:
      'buy Pinterest followers Nigeria, real Pinterest followers Naira, grow Pinterest Nigeria',
    intro:
      'More followers means Pinterest surfaces your pins to more home feeds. SABI grows your following with real Nigerians.',
    benefits: [
      'Real, active Nigerian followers.',
      'Wider distribution for every pin.',
      'Natural pacing that looks organic.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },

  /* ---------------------------- Tier 3 ---------------------------- */

  {
    slug: 'instagram-saves-nigeria',
    serviceId: 'ig_saves',
    platform: 'Instagram',
    unit: 'saves',
    h1: 'Buy Instagram Saves in Nigeria',
    tagline: 'Saves — the signal Instagram treats as strongest intent.',
    metaTitle: 'Buy Instagram Saves in Nigeria — Real Saves',
    metaDescription:
      'Get real Instagram saves from Nigerians. Saves are one of the strongest "valuable content" signals to the algorithm. Fast start, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy Instagram saves Nigeria, Instagram saves Naira, boost Instagram reach Nigeria, Instagram algorithm saves',
    intro:
      'A save tells Instagram your post is worth coming back to — one of the strongest signals it uses to decide reach. SABI delivers real saves from Nigerians.',
    benefits: [
      'Saves — among the highest-value algorithm signals.',
      'Pushes your post toward Explore and more feeds.',
      'From real Nigerians, so it reads as genuine intent.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'instagram-shares-nigeria',
    serviceId: 'ig_shares',
    platform: 'Instagram',
    unit: 'shares',
    h1: 'Buy Instagram Shares in Nigeria',
    tagline: 'Real shares that spread your post through DMs and stories.',
    metaTitle: 'Buy Instagram Shares in Nigeria — Real Shares',
    metaDescription:
      'Get real Instagram shares from Nigerians to spread your post further and boost reach. Fast start, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy Instagram shares Nigeria, Instagram shares Naira, boost Instagram post reach Nigeria',
    intro:
      'When people share your post to DMs and stories, Instagram reads it as content worth spreading and widens its reach. SABI delivers real shares from Nigerians.',
    benefits: [
      'Real shares that extend your post\'s reach.',
      'A strong "worth spreading" signal to the algorithm.',
      'From real Nigerians, never bots.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'tiktok-bookmarks-nigeria',
    serviceId: 'tiktok_bookmarks',
    platform: 'TikTok',
    unit: 'bookmarks',
    h1: 'Buy TikTok Bookmarks in Nigeria',
    tagline: 'Saves that tell TikTok your video is worth returning to.',
    metaTitle: 'Buy TikTok Bookmarks in Nigeria — Real Saves',
    metaDescription:
      'Get real TikTok bookmarks (saves) from Nigerians — a strong signal your video is worth revisiting. Fast start, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy TikTok bookmarks Nigeria, TikTok saves Naira, boost TikTok video Nigeria, TikTok favorites',
    intro:
      'A bookmark says a viewer wants to come back to your video — a signal TikTok weighs heavily when deciding reach. SABI delivers real saves from Nigerians.',
    benefits: [
      'Bookmarks — a high-value For You Page signal.',
      'Marks your video as reference-worthy content.',
      'From real Nigerians, so it looks genuine.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'tiktok-live-views-nigeria',
    serviceId: 'tiktok_live_views',
    platform: 'TikTok',
    unit: 'live views',
    h1: 'Buy TikTok LIVE Views in Nigeria',
    tagline: 'Real viewers that get your LIVE ranked and recommended.',
    metaTitle: 'Buy TikTok LIVE Views in Nigeria — Real Live Viewers',
    metaDescription:
      'Get real TikTok LIVE viewers from Nigerians to climb the LIVE rankings and get recommended. Fast start, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy TikTok live views Nigeria, TikTok LIVE viewers Naira, boost TikTok live Nigeria',
    intro:
      'TikTok recommends LIVEs that already have viewers — momentum begets momentum. SABI gets real Nigerians into your LIVE so it climbs the rankings.',
    benefits: [
      'Real live viewers that lift your LIVE ranking.',
      'More recommendations into other users\' feeds.',
      'From real Nigerians, never bots.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'youtube-shares-nigeria',
    serviceId: 'youtube_shares',
    platform: 'YouTube',
    unit: 'shares',
    h1: 'Buy YouTube Shares in Nigeria',
    tagline: 'Real shares that spread your video beyond YouTube.',
    metaTitle: 'Buy YouTube Shares in Nigeria — Real Shares',
    metaDescription:
      'Get real YouTube shares from Nigerians to spread your video and signal quality to the algorithm. Natural pacing, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy YouTube shares Nigeria, YouTube shares Naira, boost YouTube video reach Nigeria',
    intro:
      'Shares carry your video to new audiences off-platform and tell YouTube it\'s worth recommending. SABI delivers real shares from Nigerians.',
    benefits: [
      'Real shares that widen your video\'s reach.',
      'A positive quality signal to the algorithm.',
      'From real Nigerians, so it looks organic.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'twitter-replies-nigeria',
    serviceId: 'twitter_replies',
    platform: 'X (Twitter)',
    unit: 'replies',
    h1: 'Buy X (Twitter) Replies in Nigeria',
    tagline: 'Real Nigerian replies that make a post look like a conversation.',
    metaTitle: 'Buy Twitter (X) Replies in Nigeria — Real Replies',
    metaDescription:
      'Get real, relevant X (Twitter) replies from Nigerians to spark conversation and lift your post. Fast start, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy Twitter replies Nigeria, buy X replies Nigeria, real tweet replies Naira, boost tweet engagement',
    intro:
      'Replies are the engagement X ranks highest — a busy thread pulls in more eyes and more replies. SABI delivers real, on-topic replies from Nigerians.',
    benefits: [
      'Real, relevant replies — genuine sentences, not spam.',
      'The highest-weighted engagement on X.',
      'From real Nigerians who read the post.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'spotify-track-likes-nigeria',
    serviceId: 'spotify_likes',
    platform: 'Spotify',
    unit: 'track likes',
    h1: 'Buy Spotify Track Likes in Nigeria',
    tagline: 'Real saves that feed Spotify\'s recommendation engine.',
    metaTitle: 'Buy Spotify Track Likes in Nigeria — Real Saves',
    metaDescription:
      'Get real Spotify track likes (saves) from Nigerians to feed the recommendation algorithm. Natural pacing, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy Spotify likes Nigeria, Spotify saves Naira, promote track Nigeria, boost Spotify song Nigeria',
    intro:
      'When listeners save your track, Spotify learns it\'s worth recommending in Discover Weekly and Radio. SABI delivers real saves from Nigerians.',
    benefits: [
      'Real track saves that feed recommendations.',
      'Signals to Spotify your song resonates.',
      'From real Nigerian listeners.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'threads-likes-nigeria',
    serviceId: 'threads_likes',
    platform: 'Threads',
    unit: 'likes',
    h1: 'Buy Threads Likes in Nigeria',
    tagline: 'Real Nigerian likes that give your Threads posts traction.',
    metaTitle: 'Buy Threads Likes in Nigeria — Real Likes',
    metaDescription:
      'Get real Threads likes from Nigerians to give your posts early traction and reach. Fast start, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy Threads likes Nigeria, real Threads likes Naira, boost Threads post Nigeria',
    intro:
      'Early likes decide whether a Threads post gains traction or fades. SABI gives yours real likes from Nigerians when it matters.',
    benefits: [
      'Real likes that build early post traction.',
      'Fast start on new posts.',
      'From real Nigerians, never bots.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'telegram-reactions-nigeria',
    serviceId: 'telegram_reactions',
    platform: 'Telegram',
    unit: 'reactions',
    h1: 'Buy Telegram Reactions in Nigeria',
    tagline: 'Real reactions that make your channel posts look engaged.',
    metaTitle: 'Buy Telegram Reactions in Nigeria — Real Reactions',
    metaDescription:
      'Get real Telegram post reactions from Nigerians so your channel looks active and engaged. Fast start, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy Telegram reactions Nigeria, Telegram post reactions Naira, boost Telegram channel Nigeria',
    intro:
      'Reactions under your Telegram posts show a channel people actually engage with. SABI delivers real reactions from Nigerians.',
    benefits: [
      'Real reactions that signal an engaged channel.',
      'Fast start on new posts.',
      'From real Nigerians, so it holds up.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'pinterest-repins-nigeria',
    serviceId: 'pinterest_repins',
    platform: 'Pinterest',
    unit: 'repins',
    h1: 'Buy Pinterest Repins in Nigeria',
    tagline: 'Real repins that spread your pin across more boards.',
    metaTitle: 'Buy Pinterest Repins in Nigeria — Real Repins',
    metaDescription:
      'Get real Pinterest repins from Nigerians to spread your pin across boards and widen reach. Natural pacing, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy Pinterest repins Nigeria, Pinterest saves Naira, boost Pinterest pin Nigeria',
    intro:
      'Every repin puts your pin on another board and in front of a new audience — the way content spreads on Pinterest. SABI delivers real repins from Nigerians.',
    benefits: [
      'Real repins that spread your pin further.',
      'More distribution across boards and feeds.',
      'From real Nigerians, never bots.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'snapchat-story-views-nigeria',
    serviceId: 'snapchat_story_views',
    platform: 'Snapchat',
    unit: 'story views',
    h1: 'Buy Snapchat Story Views in Nigeria',
    tagline: 'Real story views that prove an active, watched account.',
    metaTitle: 'Buy Snapchat Story Views in Nigeria — Real Views',
    metaDescription:
      'Get real Snapchat story views from Nigerians so your account looks active and watched. Fast start, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy Snapchat story views Nigeria, Snapchat views Naira, boost Snapchat story Nigeria',
    intro:
      'Story views are the proof that people are actually watching what you post. SABI gets real Nigerians viewing your Snapchat stories.',
    benefits: [
      'Real story views that signal an active account.',
      'Fast start within the 24-hour story window.',
      'From real Nigerians, so the counts hold up.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'twitch-subscribers-nigeria',
    serviceId: 'twitch_subs',
    platform: 'Twitch',
    unit: 'subscriptions',
    h1: 'Buy Twitch Subscriptions in Nigeria',
    tagline: 'Real subs that boost your channel\'s status and reach.',
    metaTitle: 'Buy Twitch Subscriptions in Nigeria — Real Subs',
    metaDescription:
      'Get real Twitch subscriptions from Nigerians to raise your channel\'s status and reach. Fast start, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy Twitch subs Nigeria, Twitch subscriptions Naira, grow Twitch channel Nigeria',
    intro:
      'Subscriber count is the credibility that makes a channel look worth following and supports your standing on Twitch. SABI grows yours with real Nigerians.',
    benefits: [
      'Real subscriptions that raise your channel\'s status.',
      'Stronger social proof for new viewers.',
      'From real Nigerians, never bots.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'facebook-comments-nigeria',
    serviceId: 'fb_comments',
    platform: 'Facebook',
    unit: 'comments',
    h1: 'Buy Facebook Comments in Nigeria',
    tagline: 'Real Nigerian comments that get a post talked about.',
    metaTitle: 'Buy Facebook Comments in Nigeria — Real Comments',
    metaDescription:
      'Get real, relevant Facebook comments from Nigerians to spark discussion and lift reach. Fast start, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy Facebook comments Nigeria, real Facebook comments Naira, boost Facebook post Nigeria',
    intro:
      'Comments are the engagement Facebook rewards with reach, and the social proof that draws more people in. SABI delivers real, on-topic comments from Nigerians.',
    benefits: [
      'Real, relevant comments — genuine sentences, not spam.',
      'Discussion that lifts a post\'s reach.',
      'From real Nigerians who read the post.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'facebook-shares-nigeria',
    serviceId: 'fb_shares',
    platform: 'Facebook',
    unit: 'shares',
    h1: 'Buy Facebook Shares in Nigeria',
    tagline: 'Real shares that carry your post to new timelines.',
    metaTitle: 'Buy Facebook Shares in Nigeria — Real Shares',
    metaDescription:
      'Get real Facebook shares from Nigerians to spread your post to new audiences. Fast start, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy Facebook shares Nigeria, Facebook shares Naira, boost Facebook post reach Nigeria',
    intro:
      'A share carries your post onto someone else\'s timeline — the way content travels on Facebook. SABI delivers real shares from Nigerians.',
    benefits: [
      'Real shares that extend your post\'s reach.',
      'A strong "worth spreading" signal.',
      'From real Nigerians, never bots.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'whatsapp-channel-followers-nigeria',
    serviceId: 'whatsapp_followers',
    platform: 'WhatsApp',
    unit: 'channel followers',
    h1: 'Buy WhatsApp Channel Followers in Nigeria',
    tagline: 'Real Nigerian followers that make your channel worth joining.',
    metaTitle: 'Buy WhatsApp Channel Followers in Nigeria — Real Followers',
    metaDescription:
      'Grow your WhatsApp channel with real Nigerian followers so new visitors see an active community. Fast start, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy WhatsApp channel followers Nigeria, WhatsApp channel members Naira, grow WhatsApp channel Nigeria',
    intro:
      'Nobody follows an empty WhatsApp channel. SABI seeds yours with real Nigerian followers so new visitors see a community worth joining.',
    benefits: [
      'Real Nigerian followers that build credibility.',
      'Fast start with natural pacing.',
      'No password needed — just your channel link.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'rumble-subscribers-nigeria',
    serviceId: 'rumble_subscribers',
    platform: 'Rumble',
    unit: 'subscribers',
    h1: 'Buy Rumble Subscribers in Nigeria',
    tagline: 'Real subscribers that grow your Rumble channel.',
    metaTitle: 'Buy Rumble Subscribers in Nigeria — Real & Active',
    metaDescription:
      'Grow your Rumble channel with real Nigerian subscribers. Natural pacing, no password, live naira pricing. You only pay for what\'s delivered.',
    keywords:
      'buy Rumble subscribers Nigeria, real Rumble subscribers Naira, grow Rumble channel Nigeria',
    intro:
      'Subscriber count is the credibility a new viewer weighs before following your Rumble channel. SABI grows yours with real Nigerians.',
    benefits: [
      'Real, active Nigerian subscribers.',
      'Natural pacing that looks organic.',
      'No password needed — just your channel link.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'rumble-views-nigeria',
    serviceId: 'rumble_views',
    platform: 'Rumble',
    unit: 'views',
    h1: 'Buy Rumble Views in Nigeria',
    tagline: 'Real views that build momentum on your Rumble videos.',
    metaTitle: 'Buy Rumble Views in Nigeria — Real Video Views',
    metaDescription:
      'Get real Rumble video views from Nigerians to build momentum and credibility. Natural pacing, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy Rumble views Nigeria, Rumble video views Naira, boost Rumble video Nigeria',
    intro:
      'View count is the first thing viewers judge a Rumble video by, and momentum feeds discovery. SABI gets real Nigerians viewing yours.',
    benefits: [
      'Real views that build credibility and momentum.',
      'Natural pacing that looks organic.',
      'From real Nigerians, never bots.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
  {
    slug: 'threads-comments-nigeria',
    serviceId: 'threads_comments',
    platform: 'Threads',
    unit: 'comments',
    h1: 'Buy Threads Comments in Nigeria',
    tagline: 'Real Nigerian comments that get your Threads post talked about.',
    metaTitle: 'Buy Threads Comments in Nigeria — Real Comments',
    metaDescription:
      'Get real, relevant Threads comments from Nigerians to spark conversation and lift reach. Fast start, live naira pricing, only pay for what\'s delivered.',
    keywords:
      'buy Threads comments Nigeria, real Threads comments Naira, boost Threads engagement Nigeria',
    intro:
      'A busy reply thread pulls more people into your Threads post and signals it\'s worth surfacing. SABI delivers real, on-topic comments from Nigerians.',
    benefits: [
      'Real, relevant comments — genuine sentences, not spam.',
      'Conversation that lifts a post\'s reach.',
      'From real Nigerians who read the post.',
      'Only pay for what\'s delivered, with auto-refund on shortfall.',
    ],
  },
];

export function getLanding(slug: string): Landing | undefined {
  return LANDINGS.find((l) => l.slug === slug);
}

export function allLandingSlugs(): string[] {
  return LANDINGS.map((l) => l.slug);
}

export function landingFaqs(l: Landing): { q: string; a: string }[] {
  return l.faqs && l.faqs.length ? l.faqs : baseFaqs(l.platform, l.unit);
}
