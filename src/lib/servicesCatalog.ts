export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  action: string;
  pricePerUnit: number; // in kobo
  minQuantity: number;
  maxQuantity: number;
  speed: 'instant' | 'fast' | 'medium' | 'slow';
  refillable: boolean;
  icon?: string;
}

export const PLATFORMS = {
  INSTAGRAM: 'instagram',
  TWITTER: 'twitter',
  YOUTUBE: 'youtube',
  TIKTOK: 'tiktok',
  FACEBOOK: 'facebook',
  SNAPCHAT: 'snapchat',
  SPOTIFY: 'spotify',
  WHATSAPP: 'whatsapp',
  PINTEREST: 'pinterest',
  THREADS: 'threads',
  TELEGRAM: 'telegram',
  TWITCH: 'twitch',
};

export const SERVICES_CATALOG: Service[] = [
  // ============ INSTAGRAM ============
  // Followers
  {
    id: 'ig_followers',
    name: 'Instagram Followers',
    description: `🚀 **WATCH YOUR CREDIBILITY SKYROCKET IN REAL TIME**

Order 1,000 genuine Nigerian followers and see your profile transform within 24-48 hours. Each real, active account strengthens your profile authority, making brands take notice immediately.

**WHAT YOU GET:**
✓ Real, verified Nigerian accounts from active users
✓ Consistent delivery (50-200 per hour, naturally paced)
✓ Lifetime retention guarantee—followers don't drop
✓ Algorithm boost: Instagram rewards profiles gaining followers legitimately
✓ Your follow-to-follower ratio improves dramatically

**YOUR ANALYTICS WILL SHOW:**
📊 Immediate spike in profile views (3-5x increase)
📊 Higher engagement rate across all future posts
📊 Better ranked in user searches within your niche
📊 Brands seeing 100K+ followers contact you first
📊 Your credibility score jumps—people follow because others do

**ACTIONABLE RESULTS YOU'LL USE:**
→ Negotiate better sponsorship deals (brands see larger audience)
→ Launch products with ready audience (no cold start)
→ Increase sales/services (followers = customers waiting)
→ Build authority in your niche (numbers command respect)
→ Get verified faster (Instagram favors growing accounts)

**THE WIN:** Imagine opening your phone tomorrow and seeing 1,000 new followers. That feeling of momentum, that proof your content resonates—that's what happens here. You're not buying numbers. You're buying the confidence that comes with a real, growing community.`,
    category: PLATFORMS.INSTAGRAM,
    action: 'Followers',
    pricePerUnit: 100,
    minQuantity: 100,
    maxQuantity: 50000,
    speed: 'medium',
    refillable: true,
  },
  // Likes
  {
    id: 'ig_likes',
    name: 'Instagram Post Likes',
    description: `❤️ **INSTANT VALIDATION FOR EVERY POST YOU SHARE**

Post a photo or Reel and watch 500+ real likes pour in within the first 2 hours. This isn't vanity—it's strategy. High engagement immediately signals Instagram's algorithm to show your content to thousands more people for free.

**WHAT YOU GET:**
✓ Genuine likes from real, active Nigerian followers
✓ Fast delivery (most likes within 1-2 hours)
✓ Works on photos, Reels, carousel posts—everything
✓ Engagement appears natural, never flagged as suspicious
✓ Permanent likes with no drops

**YOUR ANALYTICS WILL SHOW:**
📊 Posts hitting Explore page 2-3x faster
📊 Reach increases from 5K to 15K+ per post
📊 Higher save rate (people bookmark your content)
📊 More DMs and comments naturally following
📊 Your Insights showing steady upward trend

**ACTIONABLE RESULTS YOU'LL USE:**
→ Beat competitors (your posts get seen first)
→ Drive traffic to your business (likes = visibility)
→ Attract organic followers (people follow popular posts)
→ Influence brand perception (high-engagement accounts look credible)
→ Test content faster (see what works, double down)

**THE WIN:** That moment when you post and immediately see 50...100...500 likes rolling in? That's proof your content matters. That's momentum. That's the feeling that keeps you creating. More importantly, it's the algorithmic nudge that makes Instagram work FOR you, not against you.`,
    category: PLATFORMS.INSTAGRAM,
    action: 'Likes',
    pricePerUnit: 80,
    minQuantity: 50,
    maxQuantity: 50000,
    speed: 'fast',
    refillable: true,
  },
  // Comments
  {
    id: 'ig_comments',
    name: 'Instagram Comments',
    description: `💬 **SPARK CONVERSATION THAT SIGNALS ALGORITHM SUCCESS**

Get 10-20 thoughtful, natural comments on your posts from real people. Comments do something likes can't: they create discussion threads that Instagram's algorithm absolutely loves. It's the difference between a post being shown to 5K people vs. 50K people.

**WHAT YOU GET:**
✓ Genuine comments from real, active Nigerian users
✓ Comments are relevant to your content (never spammy)
✓ Natural pacing—comments come over 2-4 hours, not all at once
✓ No bot comments (we understand Instagram's detection)
✓ Comments stay permanently

**YOUR ANALYTICS WILL SHOW:**
📊 Massive algorithmic boost (comments > likes for reach)
📊 Posts featured on Reels Tab and Explore pages
📊 Comment section activity draws organic comments too
📊 Time spent on your posts increases (algorithm notices)
📊 Post reaches followers MULTIPLE times (each comment re-shows post)

**ACTIONABLE RESULTS YOU'LL USE:**
→ Get free viral reach (algorithm rewards discussion)
→ Build comment conversation naturally (people add their thoughts)
→ Increase session time (people spend longer reading)
→ Drive business inquiries (comments = engagement = sales)
→ Test messaging (see what comments people actually want)

**THE WIN:** It's not just about the number. It's about seeing people engage with your actual words. Someone read your caption and cared enough to respond. That's real. That's community. And Instagram notices that energy and spreads it further.`,
    category: PLATFORMS.INSTAGRAM,
    action: 'Comments',
    pricePerUnit: 200,
    minQuantity: 10,
    maxQuantity: 5000,
    speed: 'medium',
    refillable: false,
  },
  // Comment Likes
  {
    id: 'ig_comment_likes',
    name: 'Instagram Comment Likes',
    description: `👍 **VALIDATE CONVERSATIONS AND BOOST COMMENT VISIBILITY**

Your comments on other people's posts deserve visibility too. Get 20-50 real likes on your comments and watch your profile get discovered from conversations happening all over Instagram. High-liked comments get pinned and seen by thousands.

**WHAT YOU GET:**
✓ Real likes on your comments from active Nigerian accounts
✓ Fast delivery (likes appear within 1-2 hours)
✓ Works on any comment you've made across Instagram
✓ Increases your visibility in comment threads
✓ Signals to Instagram that you're an active, engaging user

**YOUR ANALYTICS WILL SHOW:**
📊 Your comments becoming "top comments" on posts (more visibility)
📊 Direct messages from people seeing your high-engagement comments
📊 Profile visits increasing from comment discovery
📊 Followers from people impressed by your comments
📊 Your comment section getting better engagement

**ACTIONABLE RESULTS YOU'LL USE:**
→ Network with bigger accounts (get noticed in their communities)
→ Build authority in your niche (high-liked comments = expertise)
→ Generate leads (people view your profile from comments)
→ Start conversations that turn into partnerships
→ Become a recognizable voice in your industry

**THE WIN:** Imagine being known as the person who always drops insightful, highly-liked comments. That's positioning. That's network building. That's how you become the person everyone wants to collaborate with.`,
    category: PLATFORMS.INSTAGRAM,
    action: 'Comment Likes',
    pricePerUnit: 120,
    minQuantity: 20,
    maxQuantity: 10000,
    speed: 'fast',
    refillable: true,
  },
  // Saves
  {
    id: 'ig_saves',
    name: 'Instagram Saves',
    description: `🔖 **THE HIDDEN ALGORITHM POWER MOVE MOST CREATORS MISS**

Saves are Instagram's #1 signal that content is VALUABLE. When someone saves your post, they're saying "I want to reference this later." Instagram notices and rewards you with exponential reach. 100 saves on a post beats 1,000 likes algorithmically.

**WHAT YOU GET:**
✓ Real saves from active Nigerian users (they actually save your posts)
✓ Spread over 2-3 hours for natural appearance
✓ Works on educational, inspirational, and entertaining content
✓ Permanent saves (no drops or reversals)
✓ Massive algorithmic boost

**YOUR ANALYTICS WILL SHOW:**
📊 Posts featured on more Explore pages (saves trigger this)
📊 Reach jumping 5-10x higher than normal posts
📊 Content library saves increasing (evergreen content ROI)
📊 Higher quality engagement metrics overall
📊 Your content becoming "shareable" benchmark

**ACTIONABLE RESULTS YOU'LL USE:**
→ Educational content goes viral (saves = "teach me more")
→ Tutorials and guides get massive reach
→ Tips and advice spread across user communities
→ Become a go-to resource in your field
→ Build long-term authority (saved posts = referenced frequently)

**THE WIN:** Saves mean you created something so useful, so inspiring, so memorable that people want to come back to it. That's not vanity—that's proof of real impact. That's legacy building.`,
    category: PLATFORMS.INSTAGRAM,
    action: 'Saves',
    pricePerUnit: 150,
    minQuantity: 50,
    maxQuantity: 50000,
    speed: 'medium',
    refillable: true,
  },
  // Story Views
  {
    id: 'ig_story_views',
    name: 'Instagram Story Views',
    description: `👀 **IMMEDIATE VISIBILITY FOR TIME-SENSITIVE CONTENT**

Stories are ephemeral, which means timing is EVERYTHING. Get 500-1,000 real views on your story and maximize that 24-hour window. High view counts make your stories appear in more user feeds and attract organic viewers.

**WHAT YOU GET:**
✓ Real views from active Nigerian accounts
✓ Views counted within 1-2 hours
✓ Works on any story type (photo, video, carousel)
✓ Increases story visibility in followers' feeds
✓ Boosts your story metric for that 24-hour period

**YOUR ANALYTICS WILL SHOW:**
📊 Stories appearing higher in people's story feeds
📊 More organic views naturally following
📊 Higher interaction rate (replies, shares)
📊 Stories getting shared to DMs more often
📊 Your daily impressions increasing significantly

**ACTIONABLE RESULTS YOU'LL USE:**
→ Announcements reaching maximum audience
→ Product launches getting instant visibility
→ Behind-the-scenes content building connection
→ Flash sales reaching people in time
→ Event invitations getting better attendance

**THE WIN:** Stories are real-time connection. When people see your story has 1,000+ views, they feel the momentum. They feel like they're part of something popular, something worth watching. Momentum sells.`,
    category: PLATFORMS.INSTAGRAM,
    action: 'Story Views',
    pricePerUnit: 70,
    minQuantity: 100,
    maxQuantity: 100000,
    speed: 'fast',
    refillable: false,
  },
  // Reel Views
  {
    id: 'ig_reel_views',
    name: 'Instagram Reel Views',
    description: `🎬 **UNLOCK REELS' VIRAL MACHINE WITH INSTANT MOMENTUM**

Reels are Instagram's cash cow, and the platform prioritizes high-view content. Get 1,000-5,000 real views in the first 2 hours and trigger Instagram's algorithm to push your Reel to hundreds of thousands more people organically.

**WHAT YOU GET:**
✓ Real views from active Nigerian accounts
✓ Fast delivery that looks natural (algorithm-safe)
✓ Views count immediately toward the critical first-24-hours
✓ Triggers the algorithmic cascade that spreads Reels
✓ No suspicious activity markers

**YOUR ANALYTICS WILL SHOW:**
📊 Explosive reach growth (200-500% increase common)
📊 Explore page placement within hours
📊 Saves and shares multiplying automatically
📊 Follow-up Reels getting exponentially better reach
📊 Overall account authority increasing visibly

**ACTIONABLE RESULTS YOU'LL USE:**
→ Entertainment content going viral
→ Educational content reaching millions
→ Comedy content getting brand partnership offers
→ Tutorial content getting DMs asking to share it
→ Trend content beating competitors to audience

**THE WIN:** There's something magical about uploading a Reel and watching the view counter climb: 100...500...2,000...10,000. That's not luck. That's the algorithm working. That's you winning at Instagram's game. That's the validation every creator craves.`,
    category: PLATFORMS.INSTAGRAM,
    action: 'Reel Views',
    pricePerUnit: 65,
    minQuantity: 500,
    maxQuantity: 100000,
    speed: 'fast',
    refillable: false,
  },
  // Shares
  {
    id: 'ig_shares',
    name: 'Instagram Shares',
    description: `↗️ **THE ULTIMATE SOCIAL PROOF: PEOPLE SHARING YOUR CONTENT**

When someone shares your post to their stories or via DM, they're vouching for you to their own audience. Shares are the highest trust signal on Instagram. 10-20 shares on a post sends it viral across entire communities.

**WHAT YOU GET:**
✓ Real shares from genuine Nigerian accounts (they actually share)
✓ Shares to stories, DMs, and close friends lists
✓ Spreads your content across entire networks
✓ Each share exposes you to new audiences
✓ Creates word-of-mouth momentum

**YOUR ANALYTICS WILL SHOW:**
📊 Reach exceeding followers by 5-10x
📊 Shares showing you as trustworthy content source
📊 Viral effect kicks in (shares trigger algorithm boost)
📊 Profile visits from people in shared networks
📊 Authority skyrocketing in your niche

**ACTIONABLE RESULTS YOU'LL USE:**
→ Viral content getting brand deals
→ Important announcements reaching thousands
→ Your voice becoming recognizable across communities
→ Organic audience growing exponentially
→ Positioning yourself as a thought leader

**THE WIN:** A share means someone thought "I have to show my friends this." That's respect. That's influence. That's proof your content matters beyond just your followers. That's becoming culturally relevant.`,
    category: PLATFORMS.INSTAGRAM,
    action: 'Shares',
    pricePerUnit: 250,
    minQuantity: 20,
    maxQuantity: 10000,
    speed: 'slow',
    refillable: true,
  },

  // ============ TIKTOK ============
  // Followers
  {
    id: 'tiktok_followers',
    name: 'TikTok Followers',
    description: `🎯 **BECOME A VERIFIED CREATOR FASTER WITH REAL MOMENTUM**

TikTok's algorithm HEAVILY favors creators with growing follower counts. Get 500-2,000 real followers and watch the platform boost your videos organically. TikTok creators with momentum get exponentially more reach than stagnant accounts.

**WHAT YOU GET:**
✓ Real Nigerian TikTok followers (engaged, active accounts)
✓ Followers added consistently over 24-48 hours
✓ Accounts are age-verified and show authenticity signals
✓ No unfollows—permanent, lasting followers
✓ Boosts your For You Page algorithm ranking

**YOUR ANALYTICS WILL SHOW:**
📊 Video views increasing 3-5x with new followers
📊 Engagement rate jumping as followers watch content
📊 Comments and shares multiplying organically
📊 Verified badge eligibility getting closer (follows count)
📊 Creator Fund earnings potential increasing

**ACTIONABLE RESULTS YOU'LL USE:**
→ Qualify faster for TikTok Creator Fund (10K followers needed)
→ Get verified badge earlier (boosts credibility)
→ Attract brand partnerships (brands want follower count)
→ Negotiate better rates (bigger following = bigger paycheck)
→ Build business on TikTok with real audience

**THE WIN:** Every notification of a new follower feels like validation. You're watching your TikTok career grow in real time. Each follower is a potential customer, collaborator, or advocate. That's not vanity—that's building a media empire.`,
    category: PLATFORMS.TIKTOK,
    action: 'Followers',
    pricePerUnit: 130,
    minQuantity: 100,
    maxQuantity: 100000,
    speed: 'slow',
    refillable: true,
  },
  // Likes
  {
    id: 'tiktok_likes',
    name: 'TikTok Likes',
    description: `❤️ **CRACK THE TIKTOK ALGORITHM WITH EARLY MOMENTUM**

TikTok's algorithm decides your video's fate in the first 2 hours. Get 1,000-5,000 likes immediately and trigger the platform's recommendation system to show your video to millions. TikTok rewards videos that get instant engagement.

**WHAT YOU GET:**
✓ Real likes from active Nigerian TikTokers
✓ Likes delivered fast (most within first 1-2 hours)
✓ Engagement appears natural and authentic
✓ Works on any TikTok content (lip-sync, dance, comedy, education)
✓ Permanent likes with zero drops

**YOUR ANALYTICS WILL SHOW:**
📊 First video hitting "For You" page within hours
📊 Organic views skyrocketing (1K → 50K → 500K possible)
📊 Hashtag performance increasing dramatically
📊 Sound/trend usage benefiting from visibility
📊 Your account becoming algorithmic favorite

**ACTIONABLE RESULTS YOU'LL USE:**
→ Trend-hop content exploding before trend dies
📈 Educational content reaching millions
→ Entertainment going viral before competitors
→ Music launching with massive exposure
→ Personal brand becoming recognizable instantly

**THE WIN:** That moment when a TikTok blows up and you see 100K...500K...1M views? That's what this creates. That's the dopamine hit every content creator lives for. That's proof you made something the world wants to see.`,
    category: PLATFORMS.TIKTOK,
    action: 'Likes',
    pricePerUnit: 90,
    minQuantity: 500,
    maxQuantity: 100000,
    speed: 'fast',
    refillable: true,
  },
  // Comments
  {
    id: 'tiktok_comments',
    name: 'TikTok Comments',
    description: `💬 **SPARK CONVERSATION THAT KEEPS YOUR VIDEOS ON THE FOR YOU PAGE**

Comments signal interest and engagement. Get 20-50 thoughtful comments on your TikToks and the algorithm keeps showing your video longer, to more people. Comments create watch-time extension, which is TikTok's favorite metric.

**WHAT YOU GET:**
✓ Real comments from genuine Nigerian TikTokers
✓ Comments are relevant, never spammy or generic
✓ Delivered naturally over 2-4 hours
✓ Comments spark organic reply chains (more engagement)
✓ Permanent, stays with your video

**YOUR ANALYTICS WILL SHOW:**
📊 Average video watch time increasing 20-30%
📊 Engagement rate becoming "highly viral" tier
📊 Comments attracting more organic comments
📊 Videos staying in FYP longer (longer shelf life)
📊 Subsequent videos benefiting from high-engagement history

**ACTIONABLE RESULTS YOU'LL USE:**
→ Videos becoming community discussion hubs
→ Building parasocial relationship with followers
→ DM inquiries from interested viewers increasing
→ Collaboration offers coming from comment engagement
→ Becoming a "conversation starter" in your niche

**THE WIN:** Comments mean your content sparked thoughts, reactions, feelings. Someone didn't just watch and move on—they engaged with YOU. That's community. That's audience. That's what builds empires.`,
    category: PLATFORMS.TIKTOK,
    action: 'Comments',
    pricePerUnit: 200,
    minQuantity: 50,
    maxQuantity: 5000,
    speed: 'medium',
    refillable: false,
  },
  // Comment Likes
  {
    id: 'tiktok_comment_likes',
    name: 'TikTok Comment Likes',
    description: `👍 **BECOME THE VOICE PEOPLE LISTEN TO ON TIKTOK**

Your comments on trending TikToks are networking opportunities. Get 15-30 likes on your comments and they become "pinned" at the top, visible to everyone. Suddenly you're the face people see discussing hot topics.

**WHAT YOU GET:**
✓ Real likes on your comments from active accounts
✓ Likes appear within 1-2 hours
✓ High-liked comments get visibility bonus
✓ Your reply chains become discussion threads
✓ Profile visits from people impressed by your comments

**YOUR ANALYTICS WILL SHOW:**
📊 Your comments getting 10x more visibility
📊 Direct messages from people seeing your comments
📊 Profile followers from comment discovery
📊 Follower quality increasing (people interested in your takes)
📊 Engagement from comments turning into followers

**ACTIONABLE RESULTS YOU'LL USE:**
→ Build authority in trending conversations
→ Network with creators in your niche
→ Get discovered by brands looking for voices
→ Turn comment authority into business opportunities
→ Become the "go-to commenter" people follow

**THE WIN:** Imagine scrolling TikTok and seeing your comment at the top with 100+ likes. People are reading YOUR take. Respecting YOUR opinion. Following YOU because of how you show up. That's influence.`,
    category: PLATFORMS.TIKTOK,
    action: 'Comment Likes',
    pricePerUnit: 110,
    minQuantity: 50,
    maxQuantity: 10000,
    speed: 'fast',
    refillable: true,
  },
  // Views
  {
    id: 'tiktok_views',
    name: 'TikTok Video Views',
    description: `📊 **TRIGGER THE VIRAL ALGORITHM THAT TURNS VIEWS INTO MILLIONS**

More views = more algorithmic favor. Get 5,000-20,000 views on your new TikToks and watch organic views climb exponentially. TikTok's algorithm literally works harder to push videos with strong view momentum.

**WHAT YOU GET:**
✓ Real views from genuine Nigerian accounts
✓ Fast delivery that appears natural to algorithm
✓ Views spread over 1-2 hours (won't look suspicious)
✓ Counts toward all important TikTok metrics
✓ No drops, permanent views

**YOUR ANALYTICS WILL SHOW:**
📊 Organic views multiplying by 3-10x afterward
📊 Videos breaking past algorithmic threshold immediately
📊 Getting into users' FYP pages faster
📊 Follow-up videos performing better (algorithm trusts you)
📊 Overall account authority skyrocketing

**ACTIONABLE RESULTS YOU'LL USE:**
→ New creators reaching 100K+ views within weeks
→ Consistent viral performance possible
→ Building portfolio for brand deals
→ Monetization happening faster
→ Creator Fund earnings increasing rapidly

**THE WIN:** Watching your view count climb from 100 to 10,000 to 100,000 is addictive. It's validating. It's proof. It's the kind of momentum that makes creators keep creating, keep improving, keep building.`,
    category: PLATFORMS.TIKTOK,
    action: 'Views',
    pricePerUnit: 60,
    minQuantity: 500,
    maxQuantity: 500000,
    speed: 'fast',
    refillable: false,
  },
  // Shares
  {
    id: 'tiktok_shares',
    name: 'TikTok Shares',
    description: `↗️ **PROOF YOUR CONTENT IS SO GOOD PEOPLE SEND IT EVERYWHERE**

Shares are TikTok's strongest viral signal. When someone shares your TikTok, they're saying "this is worth showing my friends." 10-20 shares trigger viral avalanche as each share exposes you to new networks.

**WHAT YOU GET:**
✓ Real shares from genuine Nigerian accounts
✓ Shares to friends, groups, and messaging apps
✓ Each share spreads content across entire networks
✓ Shares create word-of-mouth viral effect
✓ Permanent record of viral momentum

**YOUR ANALYTICS WILL SHOW:**
📊 Reach exploding 5-20x beyond your follower count
📊 Organic shares multiplying (shares beget shares)
📊 Videos hitting global trending potential
📊 Profile visits from share discovery networks
📊 Follower quality jumping (people who've heard of you)

**ACTIONABLE RESULTS YOU'LL USE:**
→ Viral videos bringing business inquiries
→ Entertainment breaking through noise
→ Music releases getting distribution boost
→ Personal brand becoming household name
→ Partnerships and sponsorships from viral momentum

**THE WIN:** A share means someone cared enough about your content to make it part of their social identity. That's proof of impact. That's influence. That's becoming someone people talk about.`,
    category: PLATFORMS.TIKTOK,
    action: 'Shares',
    pricePerUnit: 180,
    minQuantity: 50,
    maxQuantity: 10000,
    speed: 'slow',
    refillable: true,
  },
  // Bookmarks
  {
    id: 'tiktok_bookmarks',
    name: 'TikTok Bookmarks',
    description: `🔖 **CREATE EVERGREEN VALUE THAT PEOPLE KEEP COMING BACK TO**

Bookmarks mean your content is so useful, entertaining, or inspiring that people want to watch it again. Get 100-500 bookmarks and your video enters "saved content" libraries everywhere—infinite re-watches and re-shares months later.

**WHAT YOU GET:**
✓ Real bookmarks from active Nigerian TikTokers
✓ Bookmarks indicate high-value content
✓ Creates long-tail traffic (views months after posting)
✓ Evergreen content becomes assets that keep giving
✓ Algorithmic boost for quality content

**YOUR ANALYTICS WILL SHOW:**
📊 Videos getting views weeks and months after posting
📊 Saved content library being shared to friends
📊 Evergreen videos becoming consistent traffic source
📊 Compound effect: old videos still driving results
📊 Account showing staying power (not flash in pan)

**ACTIONABLE RESULTS YOU'LL USE:**
→ Educational content becoming permanent reference
→ Tutorial videos being shared in study/work groups
→ Inspirational content saved for tough days
→ Entertainment becoming comfort watches
→ Building content library that pays dividends forever

**THE WIN:** Long after you post, people are still watching, still bookmarking, still talking about your content. That's legacy. That's proof you created something that matters. That's building an asset that doesn't expire.`,
    category: PLATFORMS.TIKTOK,
    action: 'Bookmarks',
    pricePerUnit: 140,
    minQuantity: 100,
    maxQuantity: 50000,
    speed: 'medium',
    refillable: true,
  },

  // ============ YOUTUBE ============
  // Subscribers
  {
    id: 'youtube_subscribers',
    name: 'YouTube Subscribers',
    description: `📺 **UNLOCK YOUTUBE ALGORITHM POWER WITH AUTHENTIC SUBSCRIBER GROWTH**

YouTube's algorithm is subscriber-obsessed. Get 100-500 real subscribers and watch the platform promote your entire channel. Higher subscriber count = higher ranking in search, recommendations, and trending.

**WHAT YOU GET:**
✓ Real Nigerian YouTube subscribers
✓ Subscriptions from active, verified accounts
✓ Consistent delivery over 24-48 hours
✓ Subscribers who can like, comment, watch future videos
✓ Permanent subscriptions with refill protection

**YOUR ANALYTICS WILL SHOW:**
📊 Channel ranking improving in your niche
📊 Recommendation algorithm showing your videos more often
📊 Subscriber notification system activating followers
📊 Average views per video increasing 2-3x
📊 Watch hours climbing (key YouTube metric)

**ACTIONABLE RESULTS YOU'LL USE:**
→ Qualify for YouTube Partner Program (1K subscribers milestone)
→ Monetization unlocking faster
→ Brand deals coming from verified channel status
→ Video performance improving across board
→ Channel authority building exponentially

**THE WIN:** YouTube subscribers are like email subscribers—they're recurring audience. Each subscriber is a notification that shows them your newest video. That's not one-time engagement. That's relationship. That's building a loyal following.`,
    category: PLATFORMS.YOUTUBE,
    action: 'Subscribers',
    pricePerUnit: 200,
    minQuantity: 100,
    maxQuantity: 50000,
    speed: 'medium',
    refillable: true,
  },
  // Views
  {
    id: 'youtube_views',
    name: 'YouTube Video Views',
    description: `📊 **BREAK INTO YOUTUBE'S ALGORITHM WITH CRITICAL MASS OF VIEWS**

YouTube decides if videos go viral in the first 24 hours. Get 2,000-10,000 views immediately and trigger YouTube to show your video in recommendations, suggestions, and search results. Initial velocity is everything.

**WHAT YOU GET:**
✓ Real views from active Nigerian accounts
✓ Views watch significant portions (not rushed)
✓ Fast delivery that looks organic
✓ Counts toward all YouTube metrics equally
✓ Views stick permanently (no reversals)

**YOUR ANALYTICS WILL SHOW:**
📊 Organic views multiplying 2-5x afterward
📊 Average view duration improving (keeps people watching)
📊 Click-through-rate on recommendations increasing
📊 Search ranking improving for video keywords
📊 Channel video list getting algorithmic boost

**ACTIONABLE RESULTS YOU'LL USE:**
→ New creators hitting 100K views within weeks
→ Video monetization unlocking sooner
→ Building portfolio for sponsorships
→ Establishing niche authority
→ Creating momentum for next videos

**THE WIN:** YouTube success is visible. Watch time goes up. Views accumulate. Revenue increases. You're literally watching your success on a dashboard. That's tangible. That's motivating. That's the kind of progress that keeps you creating.`,
    category: PLATFORMS.YOUTUBE,
    action: 'Views',
    pricePerUnit: 80,
    minQuantity: 1000,
    maxQuantity: 500000,
    speed: 'fast',
    refillable: false,
  },
  // Likes
  {
    id: 'youtube_likes',
    name: 'YouTube Video Likes',
    description: `👍 **SIGNAL QUALITY CONTENT THAT YOUTUBE REWARDS WITH EXPOSURE**

YouTube uses likes as content quality indicator. Get 200-500 likes and your video gets rated as high-quality, worthy of promotion. More promotion = exponentially more views from YouTube's recommendation system.

**WHAT YOU GET:**
✓ Real likes from engaged Nigerian viewers
✓ Likes from people who actually watched
✓ Delivered naturally over 2-3 hours
✓ Improves video ratio (likes vs. dislikes matters)
✓ Permanent likes with no drops

**YOUR ANALYTICS WILL SHOW:**
📊 Like-to-view ratio improving dramatically
📊 YouTube algorithm favoring video in recommendations
📊 Comments section getting more organic engagement
📊 Viewer satisfaction metrics improving
📊 Video getting algorithmic "quality" badge

**ACTIONABLE RESULTS YOU'LL USE:**
→ Video becoming recommended video
→ Traffic from YouTube recommendations increasing
→ Building credibility for future videos
→ Creating social proof (people trust high-liked content)
→ Starting viral feedback loop

**THE WIN:** Likes are immediate feedback that people enjoyed your work. Not just watched—but appreciated. That's the validation creators live for. That's the signal that you're on the right track.`,
    category: PLATFORMS.YOUTUBE,
    action: 'Likes',
    pricePerUnit: 150,
    minQuantity: 100,
    maxQuantity: 50000,
    speed: 'fast',
    refillable: true,
  },
  // Comments
  {
    id: 'youtube_comments',
    name: 'YouTube Comments',
    description: `💬 **BUILD COMMUNITY ENGAGEMENT THAT YOUTUBE ALGORITHM ADORES**

YouTube's algorithm prioritizes videos with active comments. Get 15-30 meaningful comments and your video stays in recommendations longer, reaches more people, appears in more feeds. Comments = signals to YouTube your content matters.

**WHAT YOU GET:**
✓ Real comments from genuine Nigerian viewers
✓ Comments are relevant and thoughtful (never bot-like)
✓ Comments come naturally over 3-5 hours
✓ Comments attract organic comment sections
✓ Creates discussion threads that enhance video value

**YOUR ANALYTICS WILL SHOW:**
📊 Comments boosting video watch time (people read)
📊 Engagement metrics showing active community
📊 Video getting longer shelf life in recommendations
📊 Comment section becoming social hub
📊 Organic comments multiplying afterward

**ACTIONABLE RESULTS YOU'LL USE:**
→ Building genuine community around content
→ Creating conversation that drives long-term views
→ Positioning yourself as approachable creator
→ Gathering feedback that improves future content
→ Starting parasocial relationships with audience

**THE WIN:** Comments mean people cared enough to speak up. They're not just consuming—they're participating. They're part of YOUR community. That's what makes content creation meaningful.`,
    category: PLATFORMS.YOUTUBE,
    action: 'Comments',
    pricePerUnit: 300,
    minQuantity: 20,
    maxQuantity: 5000,
    speed: 'medium',
    refillable: false,
  },
  // Comment Likes
  {
    id: 'youtube_comment_likes',
    name: 'YouTube Comment Likes',
    description: `👍 **MAKE YOUR VOICE HEARD IN YOUTUBE'S BIGGEST CONVERSATIONS**

High-liked comments get pinned, get visibility, become discussion leaders. Get 20-50 likes on your YouTube comments and people start following you, DMing you, valuing your perspective. YouTube comment sections are networking goldmines.

**WHAT YOU GET:**
✓ Real likes on your YouTube comments
✓ Likes that bump comments to the top
✓ Visibility in threads with millions of views
✓ Profile discovery from comment engagement
✓ Authority building in your niche communities

**YOUR ANALYTICS WILL SHOW:**
📊 Your comments becoming "top comments"
📊 Direct messages from impressed viewers
📊 Subscriber gains from comment visibility
📊 Network connections forming from credibility
📊 Collaboration opportunities emerging

**ACTIONABLE RESULTS YOU'LL USE:**
→ Building authority in your expertise area
→ Networking with creators and influencers
→ Getting discovered by opportunities
→ Creating micro-reputation across communities
→ Positioning yourself as knowledge leader

**THE WIN:** Your voice matters. When people like your comments, upvote your perspective, follow you because of how intelligently you engage—that's respect. That's influence. That's becoming someone people listen to.`,
    category: PLATFORMS.YOUTUBE,
    action: 'Comment Likes',
    pricePerUnit: 120,
    minQuantity: 50,
    maxQuantity: 10000,
    speed: 'fast',
    refillable: true,
  },
  // Shares
  {
    id: 'youtube_shares',
    name: 'YouTube Shares',
    description: `↗️ **VIRAL PROOF: WHEN YOUTUBE VIDEO BECOMES CONVERSATION**

YouTube shares mean your video is SO valuable/entertaining/important that people share it beyond YouTube. 10-20 shares on a video triggers viral cascade—each share exposes it to new networks, new audiences, new opportunities.

**WHAT YOU GET:**
✓ Real shares from genuine accounts
✓ Shares to WhatsApp, email, messaging apps, social media
✓ Each share spreading to new audiences
✓ Cross-platform viral potential
✓ Permanent share record of momentum

**YOUR ANALYTICS WILL SHOW:**
📊 Reach exploding 3-10x beyond subscribers
📊 Views coming from share sources
📊 Organic shares multiplying (shares attract shares)
📊 Video becoming topic of conversation
📊 Channel authority jumping from viral effect

**ACTIONABLE RESULTS YOU'LL USE:**
→ Entertainment going truly viral
→ Educational content becoming reference material
→ Business content getting serious traction
→ Music launching with distribution effect
→ Personal brand spreading organically

**THE WIN:** A shared video is an endorsed video. Someone literally told their network "you need to see this." That's not accidental success—that's influence. That's impact. That's proof you created something that matters beyond your immediate audience.`,
    category: PLATFORMS.YOUTUBE,
    action: 'Shares',
    pricePerUnit: 250,
    minQuantity: 30,
    maxQuantity: 10000,
    speed: 'slow',
    refillable: true,
  },

  // ============ TWITTER (X) ============
  // Followers
  {
    id: 'twitter_followers',
    name: 'Twitter Followers',
    description: `🚀 **BUILD AUTHORITY ON TWITTER (X) WITH REAL FOLLOWER GROWTH**

Twitter rewards active, growing accounts. Get 200-1,000 real followers and watch your tweets get more reach, impressions, and engagement. Twitter's algorithm prioritizes accounts with momentum.

**WHAT YOU GET:**
✓ Real Nigerian Twitter/X followers
✓ Followers from verified, active accounts
✓ Consistent growth over 24-48 hours
✓ Followers who engage with your content
✓ Permanent followers with no reversals

**YOUR ANALYTICS WILL SHOW:**
📊 Tweets reaching exponentially more people
📊 Engagement rate (likes, retweets, replies) increasing
📊 Impression counts doubling, tripling, exploding
📊 Conversation starters becoming trending material
📊 Account authority rising in your niche

**ACTIONABLE RESULTS YOU'LL USE:**
→ Your takes getting amplified across platform
→ Brand partnerships emerging from visibility
→ Thought leadership positioning solidifying
→ Network expanding exponentially
→ Influence increasing with each tweet

**THE WIN:** Twitter is about VOICE. Followers mean people want to hear what you have to say. Your perspective matters. Your opinions are valued. That's not just audience—that's power.`,
    category: PLATFORMS.TWITTER,
    action: 'Followers',
    pricePerUnit: 120,
    minQuantity: 100,
    maxQuantity: 50000,
    speed: 'slow',
    refillable: true,
  },
  // Likes
  {
    id: 'twitter_likes',
    name: 'Twitter Likes',
    description: `❤️ **MAKE YOUR TWEETS TRENDING WITH INSTANT LIKE VELOCITY**

Twitter's algorithm prioritizes tweets getting immediate engagement. Get 500-2,000 likes in the first hour and watch Twitter show your tweet to hundreds of thousands more people. Velocity is everything on Twitter.

**WHAT YOU GET:**
✓ Real likes from active Nigerian Twitter users
✓ Likes delivered fast (most within 1 hour)
✓ Engagement that looks natural and organic
✓ Works on tweets, replies, retweets
✓ Permanent likes with no drops

**YOUR ANALYTICS WILL SHOW:**
📊 Tweet impressions jumping 2-5x
📊 Reach spreading to non-followers rapidly
📊 Organic likes multiplying afterward
📊 Tweet getting conversation traction
📊 Profile visibility increasing

**ACTIONABLE RESULTS YOU'LL USE:**
→ Your opinions reaching millions
→ Opportunities emerging from visibility
→ Thought leadership establishing
→ Business inquiries coming from visibility
→ Becoming voice people listen to

**THE WIN:** Twitter success is visible in real-time. You see retweets, likes, replies flowing in. You see your impact. You see influence building. That's addictive. That's empowering.`,
    category: PLATFORMS.TWITTER,
    action: 'Likes',
    pricePerUnit: 90,
    minQuantity: 200,
    maxQuantity: 50000,
    speed: 'fast',
    refillable: true,
  },
  // Retweets
  {
    id: 'twitter_retweets',
    name: 'Twitter Retweets',
    description: `🔄 **AMPLIFY YOUR MESSAGE ACROSS TWITTER WITH VIRAL RETWEETS**

Retweets are Twitter's version of shares. When someone retweets you, they're endorsing your tweet to their entire network. Get 100-500 retweets and your message spreads exponentially. Retweets = reaching people you don't follow.

**WHAT YOU GET:**
✓ Real retweets from genuine accounts
✓ Retweets delivered over 2-3 hours
✓ Each retweet reaching entire follower network
✓ Viral cascade effect (retweets attract retweets)
✓ Permanent with no reversals

**YOUR ANALYTICS WILL SHOW:**
📊 Tweet reach exceeding follower count 5-10x
📊 Impressions exploding
📊 New followers from share discovery
📊 Organic retweets multiplying
📊 Message spreading to networks you've never reached

**ACTIONABLE RESULTS YOU'LL USE:**
→ Important announcements reaching masses
→ Product launches amplified
→ Ideas becoming part of Twitter conversation
→ Influence multiplying across networks
→ Thought becoming mainstream

**THE WIN:** Your message isn't stuck with your followers—it's spreading. It's becoming part of larger conversations. That's not just engagement—that's influence. That's impact.`,
    category: PLATFORMS.TWITTER,
    action: 'Retweets',
    pricePerUnit: 200,
    minQuantity: 100,
    maxQuantity: 10000,
    speed: 'medium',
    refillable: true,
  },
  // Replies
  {
    id: 'twitter_replies',
    name: 'Twitter Replies',
    description: `💬 **CREATE CONVERSATION THAT TWITTER ALGORITHM PROMOTES**

Replies create engagement chains. Get 20-50 thoughtful replies and your tweet becomes discussion hub. Twitter's algorithm shows high-conversation tweets to exponentially more people because they drive session time.

**WHAT YOU GET:**
✓ Real replies from genuine Twitter users
✓ Replies are contextual and thoughtful
✓ Delivered naturally over 3-4 hours
✓ Replies attract organic reply chains
✓ Conversation becomes self-perpetuating

**YOUR ANALYTICS WILL SHOW:**
📊 Tweet engagement multiplying
📊 Average session time on tweet increasing
📊 Algorithmic boost from conversation volume
📊 Thread visibility expanding
📊 Profile becoming conversation destination

**ACTIONABLE RESULTS YOU'LL USE:**
→ Your ideas becoming topics of debate
→ Authority established through discourse
→ Building thinking platform
→ Creating intellectual currency
→ Becoming voice of authority

**THE WIN:** Replies mean engagement. Real humans reading your words and responding. That's not passive consumption—that's active participation. That's community. That's having a voice.`,
    category: PLATFORMS.TWITTER,
    action: 'Replies',
    pricePerUnit: 250,
    minQuantity: 50,
    maxQuantity: 10000,
    speed: 'medium',
    refillable: false,
  },
  // Views
  {
    id: 'twitter_views',
    name: 'Twitter Views',
    description: `👀 **AMPLIFY YOUR MESSAGE TO MILLIONS ON TWITTER**

Twitter views are your reach metric. Get 10,000-50,000 views and your message spreads across the platform. High view counts trigger algorithm to show tweets in more feeds, replies, recommendations.

**WHAT YOU GET:**
✓ Real views from active accounts
✓ Views delivered fast and naturally
✓ Counts toward all metrics equally
✓ No drops or reversals
✓ Algorithm-safe delivery

**YOUR ANALYTICS WILL SHOW:**
📊 Reach exploding
📊 Impressions multiplying
📊 Tweet becoming visible to more people
📊 Algorithm showing tweet in more contexts
📊 Authority increasing

**ACTIONABLE RESULTS YOU'LL USE:**
→ Message reaching millions
→ Influence spreading
→ Thought becoming cultural reference
→ Opportunities emerging from visibility
→ Personal brand strengthening

**THE WIN:** Views mean your words are being seen. Your voice is carrying. That's the whole point of Twitter—being heard. More views = bigger voice.`,
    category: PLATFORMS.TWITTER,
    action: 'Views',
    pricePerUnit: 50,
    minQuantity: 2000,
    maxQuantity: 500000,
    speed: 'fast',
    refillable: false,
  },
  // Quote Tweets
  {
    id: 'twitter_quote_tweets',
    name: 'Twitter Quote Tweets',
    description: `💭 **YOUR TWEETS BECOMING CONVERSATION MATERIAL ACROSS TWITTER**

Quote tweets mean people are discussing your tweet, disagreeing, agreeing, adding context. Get 20-50 quote tweets and your message reaches entirely new networks. QTs are premium engagement.

**WHAT YOU GET:**
✓ Real quote tweets with actual commentary
✓ QTs spreading message to new audiences
✓ Each QT exposing you to new networks
✓ Viral discussion effect
✓ Permanent record of influence

**YOUR ANALYTICS WILL SHOW:**
📊 Reach exploding across platform
📊 Your tweet becoming conversation topic
📊 Profile visits from QT discovery
📊 New followers from QT exposure
📊 Authority jumping from visibility

**ACTIONABLE RESULTS YOU'LL USE:**
→ Your ideas becoming meme-able
→ Thought leadership crystallizing
→ Becoming referenced account
→ Network expanding exponentially
→ Influence becoming undeniable

**THE WIN:** When people quote tweet your message, they're taking it further. They're saying "this matters enough to discuss." That's the highest compliment on Twitter.`,
    category: PLATFORMS.TWITTER,
    action: 'Quote Tweets',
    pricePerUnit: 300,
    minQuantity: 50,
    maxQuantity: 10000,
    speed: 'slow',
    refillable: false,
  },

  // ============ THREADS ============
  {
    id: 'threads_followers',
    name: 'Threads Followers',
    description: `👥 **BUILD YOUR THREADS AUDIENCE WITH REAL GROWTH**

Threads is the Twitter alternative exploding. Get 100-500 followers and establish authority early on this growing platform. Early movers win on new platforms—build your base now.

**WHAT YOU GET:**
✓ Real Threads followers from Nigerian users
✓ Followers from active, engaged accounts
✓ Early mover advantage on growing platform
✓ Foundation for long-term authority
✓ Permanent followers

**YOUR ANALYTICS WILL SHOW:**
📊 Posts reaching more people organically
📊 Engagement growing as follower base grows
📊 Authority building on emerging platform
📊 First-mover advantage establishing
📊 Influence compounding over time

**ACTIONABLE RESULTS YOU'LL USE:**
→ Establishing presence on next big platform
→ Building authority before platform explodes
→ First-mover advantage in your niche
→ Creating long-term asset
→ Positioning for Threads monetization

**THE WIN:** You're building something from the ground up. You're not late to this platform. You're early. You're positioned to be a voice people remember on Threads.`,
    category: PLATFORMS.THREADS,
    action: 'Followers',
    pricePerUnit: 150,
    minQuantity: 100,
    maxQuantity: 50000,
    speed: 'medium',
    refillable: true,
  },
  {
    id: 'threads_likes',
    name: 'Threads Likes',
    description: `❤️ **ESTABLISH ENGAGEMENT MOMENTUM ON THREADS**

Early engagement on new platforms matters more. Get 200-500 likes on your Threads posts and establish credibility on this emerging platform. Show the algorithm your content resonates.

**WHAT YOU GET:**
✓ Real likes from active Threads users
✓ Likes indicating content quality
✓ Early engagement helping algorithm learn your style
✓ Social proof on growing platform
✓ Foundation for organic growth

**YOUR ANALYTICS WILL SHOW:**
📊 Posts reaching more people
📊 Algorithmic preference forming
📊 Engagement patterns emerging
📊 Authority establishing on platform
📊 Growth compounding

**ACTIONABLE RESULTS YOU'LL USE:**
→ Building credibility early
→ Establishing content style on platform
→ Creating social proof
→ Attracting early followers organically
→ Positioning for platform growth

**THE WIN:** You're not just present on Threads—you're established. Your content gets engagement. People are responding. That's momentum on a new platform.`,
    category: PLATFORMS.THREADS,
    action: 'Likes',
    pricePerUnit: 100,
    minQuantity: 100,
    maxQuantity: 50000,
    speed: 'fast',
    refillable: true,
  },
  {
    id: 'threads_comments',
    name: 'Threads Comments',
    description: `💬 **CREATE CONVERSATION ON THREADS' EMERGING PLATFORM**

Comments create discussion. Get 15-30 comments on your Threads and build community early. Early engagement builds algorithm favor on new platforms.

**WHAT YOU GET:**
✓ Real comments from engaged users
✓ Comments creating discussion threads
✓ Engagement patterns the algorithm learns from
✓ Community foundation building
✓ Early platform authority

**YOUR ANALYTICS WILL SHOW:**
📊 Posts becoming discussion hubs
📊 Algorithm favoring your content
📊 Audience building organically
📊 Community forming around your presence
📊 Authority establishing

**ACTIONABLE RESULTS YOU'LL USE:**
→ Building community early
→ Creating conversation around ideas
→ Establishing voice on platform
→ Creating network on emerging platform
→ Preparing for platform monetization

**THE WIN:** You're not just posting on Threads—you're building community. People are discussing your ideas. That's the foundation of long-term influence.`,
    category: PLATFORMS.THREADS,
    action: 'Comments',
    pricePerUnit: 200,
    minQuantity: 20,
    maxQuantity: 5000,
    speed: 'medium',
    refillable: false,
  },

  // ============ PINTEREST ============
  {
    id: 'pinterest_followers',
    name: 'Pinterest Followers',
    description: `📌 **BUILD PINTEREST AUTHORITY FOR LONG-TERM TRAFFIC**

Pinterest followers become repeat traffic. Get 100-500 followers and build evergreen audience that visits your profile repeatedly. Pinterest traffic converts better than any platform.

**WHAT YOU GET:**
✓ Real Pinterest followers from Nigeria
✓ Followers interested in your niche
✓ Repeat traffic to your profile
✓ Long-term audience building
✓ Permanent followers

**YOUR ANALYTICS WILL SHOW:**
📊 Pinterest driving more referral traffic
📊 Long-term traffic authority building
📊 SEO benefits from Pinterest profile
📊 E-commerce potential increasing
📊 Revenue opportunity emerging

**ACTIONABLE RESULTS YOU'LL USE:**
→ Driving website traffic consistently
→ Building e-commerce business
→ SEO improving from Pinterest
→ Long-tail traffic generating sales
→ Revenue multiplying from platform

**THE WIN:** Pinterest is the highest-converting social platform. Every follower is potential customer. You're building actual business, not just audience.`,
    category: PLATFORMS.PINTEREST,
    action: 'Followers',
    pricePerUnit: 130,
    minQuantity: 100,
    maxQuantity: 50000,
    speed: 'medium',
    refillable: true,
  },
  {
    id: 'pinterest_repins',
    name: 'Pinterest Repins',
    description: `📲 **INCREASE PIN REACH AND LONG-TERM TRAFFIC WITH REPINS**

Repins amplify pins beyond your audience. Get 100-300 repins and your pins spread across thousands of Pinterest boards. More repins = exponential reach and traffic.

**WHAT YOU GET:**
✓ Real repins from engaged users
✓ Pins spreading to new boards
✓ Long-term traffic potential
✓ Compounding reach effect
✓ Evergreen traffic source

**YOUR ANALYTICS WILL SHOW:**
📊 Pin reach expanding exponentially
📊 Long-term outbound clicks increasing
📊 Website traffic from Pinterest rising
📊 SEO improving from link authority
📊 Sales/conversions increasing

**ACTIONABLE RESULTS YOU'LL USE:**
→ Pins getting exponential reach
→ Website traffic multiplying
→ E-commerce sales increasing
→ Content authority building
→ Long-term assets generating revenue

**THE WIN:** Pinterest pins keep working. They drive traffic weeks, months, years after pinning. You're building evergreen income source.`,
    category: PLATFORMS.PINTEREST,
    action: 'Repins',
    pricePerUnit: 160,
    minQuantity: 100,
    maxQuantity: 50000,
    speed: 'medium',
    refillable: true,
  },
  {
    id: 'pinterest_likes',
    name: 'Pinterest Likes',
    description: `👍 **VALIDATE PINS AND INCREASE THEIR ALGORITHMIC VALUE**

Likes on Pinterest signal valuable content. Get 150-400 likes on pins and they get prioritized in feeds and recommendations. More likes = more reach.

**WHAT YOU GET:**
✓ Real likes from active Pinterest users
✓ Likes indicating content value
📌 Algorithmic boost for pinned content
✓ Increased pin circulation
✓ Organic reach multiplying

**YOUR ANALYTICS WILL SHOW:**
📊 Pins getting more impressions
📊 Reach increasing across platform
📊 Website traffic rising
📊 Pin authority building
📊 E-commerce conversion potential

**ACTIONABLE RESULTS YOU'LL USE:**
→ Pins ranking higher in searches
→ More people seeing your content
→ Website traffic increasing
→ Sales/leads multiplying
→ Long-term traffic compounding

**THE WIN:** Pinterest success means consistent traffic and sales. That's not vanity—that's business. That's real revenue.`,
    category: PLATFORMS.PINTEREST,
    action: 'Likes',
    pricePerUnit: 120,
    minQuantity: 100,
    maxQuantity: 50000,
    speed: 'fast',
    refillable: true,
  },
  {
    id: 'pinterest_comments',
    name: 'Pinterest Comments',
    description: `💬 **CREATE ENGAGEMENT THAT BUILDS PINTEREST COMMUNITY**

Comments show pins are valuable and discussion-worthy. Get 10-20 comments and increase pin's algorithmic value. Engagement signals quality to Pinterest.

**WHAT YOU GET:**
✓ Real comments from engaged users
✓ Comments showing content value
✓ Engagement signaling quality
✓ Discussion increasing reach
✓ Community building

**YOUR ANALYTICS WILL SHOW:**
📊 Pins getting more algorithmic favor
📊 Reach increasing
📊 Traffic multiplying
📊 Authority building
📊 Revenue potential rising

**ACTIONABLE RESULTS YOU'LL USE:**
→ Pins getting better distribution
→ Traffic increasing
→ Sales rising from improved visibility
→ Authority cementing
→ Business growing

**THE WIN:** Pinterest community engagement means people are invested in your content. They're not just liking—they're discussing. That's community.`,
    category: PLATFORMS.PINTEREST,
    action: 'Comments',
    pricePerUnit: 250,
    minQuantity: 20,
    maxQuantity: 5000,
    speed: 'medium',
    refillable: false,
  },

  // ============ TELEGRAM ============
  {
    id: 'telegram_followers',
    name: 'Telegram Channel Followers',
    description: `📢 **BUILD TELEGRAM COMMUNITY FOR DIRECT, ENGAGED AUDIENCE**

Telegram followers are subscribers who get every message. Get 200-1,000 followers and build direct audience that sees everything you share. No algorithm—just pure reach to engaged community.

**WHAT YOU GET:**
✓ Real Telegram subscribers
✓ Active, engaged Nigerian users
✓ Direct messaging reach to community
✓ No algorithmic filtering
✓ Lifetime audience building

**YOUR ANALYTICS WILL SHOW:**
📊 Direct message reach 100% (not like social media)
📊 Audience growing organically
📊 Message visibility to all followers
📊 Community engagement authentic
📊 Revenue opportunity from audience

**ACTIONABLE RESULTS YOU'LL USE:**
→ Direct access to audience
→ No algorithm controlling reach
→ Pure communication channel
→ Community monetization potential
→ Loyal, engaged audience

**THE WIN:** Telegram audience is real community. People subscribed to hear from YOU specifically. That's not follower vanity—that's genuine connection. That's a business asset.`,
    category: PLATFORMS.TELEGRAM,
    action: 'Channel Followers',
    pricePerUnit: 140,
    minQuantity: 100,
    maxQuantity: 50000,
    speed: 'slow',
    refillable: true,
  },
  {
    id: 'telegram_views',
    name: 'Telegram Post Views',
    description: `👀 **INCREASE TELEGRAM POST REACH AND VISIBILITY**

Post views on Telegram show engagement and reach. Get 1,000-5,000 views and establish presence on platform. Telegram's algorithm favors posts getting consistent views.

**WHAT YOU GET:**
✓ Real views from active Telegram users
✓ Views showing post is being consumed
✓ Engagement metrics increasing
✓ Algorithmic favor building
✓ Reach expanding

**YOUR ANALYTICS WILL SHOW:**
📊 Posts reaching more people
📊 Visibility increasing
📊 Audience engagement rising
📊 Authority building
📊 Community growth momentum

**ACTIONABLE RESULTS YOU'LL USE:**
→ Posts reaching more audience
→ Message spreading effectively
→ Community visibility increasing
📊 Authority building on platform
→ Network expanding

**THE WIN:** Telegram success means direct reach. You're not competing with algorithm—you're just reaching people directly. More views = bigger voice.`,
    category: PLATFORMS.TELEGRAM,
    action: 'Post Views',
    pricePerUnit: 80,
    minQuantity: 500,
    maxQuantity: 500000,
    speed: 'fast',
    refillable: false,
  },
  {
    id: 'telegram_reactions',
    name: 'Telegram Post Reactions',
    description: `😊 **BUILD TELEGRAM COMMUNITY ENGAGEMENT WITH REACTIONS**

Reactions show posts resonate. Get 50-150 reactions and establish community engagement. Reactions = authentic engagement on Telegram.

**WHAT YOU GET:**
✓ Real reactions from engaged users
✓ Various emoji reactions showing different sentiments
✓ Genuine engagement signals
✓ Community building
✓ Algorithm favor

**YOUR ANALYTICS WILL SHOW:**
📊 Posts becoming discussion focal points
📊 Community engagement rising
📊 Message resonance clear
📊 Authority building
📊 Growth momentum visible

**ACTIONABLE RESULTS YOU'LL USE:**
→ Community building around content
→ Engagement showing message value
→ Connection with audience deepening
→ Authority establishing
→ Loyal community forming

**THE WIN:** Reactions mean people feel your message. Different emoji reactions show different perspectives and sentiments. That's nuanced, authentic community engagement.`,
    category: PLATFORMS.TELEGRAM,
    action: 'Reactions',
    pricePerUnit: 160,
    minQuantity: 100,
    maxQuantity: 50000,
    speed: 'fast',
    refillable: true,
  },

  // ============ WHATSAPP ============
  {
    id: 'whatsapp_followers',
    name: 'WhatsApp Channel Followers',
    description: `📱 **BUILD WHATSAPP COMMUNITY FOR DIRECT, PERSONAL CONNECTION**

WhatsApp channel followers get direct messages from you. Get 200-1,000 followers and build intimate community. WhatsApp = highest trust, most personal platform.

**WHAT YOU GET:**
✓ Real WhatsApp channel subscribers
✓ Direct messaging reach
✓ Personal connection platform
✓ Engaged, loyal audience
✓ Long-term community asset

**YOUR ANALYTICS WILL SHOW:**
📊 Direct reach to subscribers
📊 Message delivery 100%
📊 Engagement highest of any platform
📊 Trust building with audience
📊 Revenue opportunity

**ACTIONABLE RESULTS YOU'LL USE:**
→ Direct access to audience
→ Personal relationship building
→ No algorithm filtering
→ Most trusted platform
→ Business building potential

**THE WIN:** WhatsApp is intimate. People don't add just anyone. Your followers actively want your messages. That's not passive follower—that's active subscriber. That's real relationship.`,
    category: PLATFORMS.WHATSAPP,
    action: 'Channel Followers',
    pricePerUnit: 170,
    minQuantity: 100,
    maxQuantity: 50000,
    speed: 'slow',
    refillable: true,
  },
  {
    id: 'whatsapp_message_views',
    name: 'WhatsApp Message Views',
    description: `✅ **CONFIRM YOUR WHATSAPP MESSAGES ARE REACHING AUDIENCE**

Message views on WhatsApp show message engagement. Get 1,000-5,000 views and establish that your content resonates with subscribers.

**WHAT YOU GET:**
✓ Real message views
✓ Proof of engagement
✓ Reach confirmation
✓ Metrics for optimization
✓ Growth tracking

**YOUR ANALYTICS WILL SHOW:**
📊 Message engagement visible
📊 Reach patterns emerging
📊 Best posting times identifiable
📊 Subscriber interest clear
📊 Growth momentum trackable

**ACTIONABLE RESULTS YOU'LL USE:**
→ Understanding subscriber engagement
→ Optimizing message strategy
→ Growing audience based on data
→ Building business from WhatsApp
→ Creating monetization model

**THE WIN:** WhatsApp views are real—people are reading your messages. That's not vanity metric. That's actual reach to actual people who care.`,
    category: PLATFORMS.WHATSAPP,
    action: 'Message Views',
    pricePerUnit: 100,
    minQuantity: 500,
    maxQuantity: 500000,
    speed: 'fast',
    refillable: false,
  },
  {
    id: 'whatsapp_reactions',
    name: 'WhatsApp Message Reactions',
    description: `😊 **BUILD WHATSAPP COMMUNITY ENGAGEMENT WITH REACTIONS**

Reactions show your messages resonate. Get 30-100 reactions and prove content value. Reactions = authentic WhatsApp engagement.

**WHAT YOU GET:**
✓ Real reactions from subscribers
✓ Emoji reactions showing sentiment
✓ Engagement signals
✓ Community feedback
✓ Growth indication

**YOUR ANALYTICS WILL SHOW:**
📊 Message resonance clear
📊 Subscriber engagement visible
📊 Sentiment patterns emerging
📊 Community building
📊 Growth momentum

**ACTIONABLE RESULTS YOU'LL USE:**
→ Understanding subscriber sentiment
→ Building messages people react to
→ Creating engaging content
→ Growing engaged community
→ Building business from engagement

**THE WIN:** Reactions are intimate. WhatsApp reactions feel personal. Different emoji reactions show nuanced community sentiment. That's connection.`,
    category: PLATFORMS.WHATSAPP,
    action: 'Message Reactions',
    pricePerUnit: 140,
    minQuantity: 100,
    maxQuantity: 50000,
    speed: 'fast',
    refillable: true,
  },

  // ============ SPOTIFY ============
  {
    id: 'spotify_followers',
    name: 'Spotify Followers',
    description: `🎵 **BUILD SPOTIFY ARTIST PROFILE WITH REAL FOLLOWERS**

Spotify followers = recurring listeners. Get 100-500 followers and build fanbase that gets notifications when you release new music. Followers are subscribers.

**WHAT YOU GET:**
✓ Real Spotify followers
✓ Active music listeners
✓ Notification subscribers
✓ Repeat listener base
✓ Artist authority building

**YOUR ANALYTICS WILL SHOW:**
📊 Monthly listeners increasing
📊 Playlist placements increasing
📊 Algorithmic recommendation improving
📊 Release reach expanding
📊 Revenue potential rising

**ACTIONABLE RESULTS YOU'LL USE:**
→ Release reaching listeners automatically
→ Spotify Wrapped featuring your music
→ Playlist pitching improving
→ Artist credibility establishing
→ Music career building momentum

**THE WIN:** Spotify followers mean people love your music. They subscribed to you specifically. That's artist validation. That's career building.`,
    category: PLATFORMS.SPOTIFY,
    action: 'Followers',
    pricePerUnit: 200,
    minQuantity: 50,
    maxQuantity: 50000,
    speed: 'medium',
    refillable: true,
  },
  {
    id: 'spotify_plays',
    name: 'Spotify Track Plays',
    description: `▶️ **REACH SPOTIFY ALGORITHM THRESHOLD WITH INITIAL PLAYS**

Spotify's algorithm prioritizes tracks getting plays. Get 1,000-5,000 plays and trigger platform to push your music to more people. Initial momentum unlocks algorithmic promotion.

**WHAT YOU GET:**
✓ Real plays from Spotify listeners
✓ Plays registered in Spotify database
✓ Algorithmic momentum building
✓ Playlist consideration increasing
✓ Organic reach multiplying

**YOUR ANALYTICS WILL SHOW:**
📊 Spotify algorithm favoring track
📊 Playlist additions increasing
📊 Organic plays multiplying
📊 Monthly listeners climbing
📊 Revenue from streams rising

**ACTIONABLE RESULTS YOU'LL USE:**
→ Track hitting Spotify charts
→ Playlist features increasing
→ Playlist pitching leverage improving
→ Stream revenue starting
→ Music career momentum building

**THE WIN:** Spotify streams = money. Each stream is revenue. Watching stream count climb is watching your music career generate income.`,
    category: PLATFORMS.SPOTIFY,
    action: 'Plays',
    pricePerUnit: 120,
    minQuantity: 500,
    maxQuantity: 100000,
    speed: 'medium',
    refillable: false,
  },
  {
    id: 'spotify_likes',
    name: 'Spotify Track Likes',
    description: `❤️ **BUILD TRACK ENGAGEMENT ON SPOTIFY WITH SAVES**

Saves (likes) on Spotify create repeat listeners and save you to playlists. Get 100-300 likes and trigger playlist algorithms. Saves = algorithm signal of quality.

**WHAT YOU GET:**
✓ Real saves/likes from Spotify users
✓ Users adding track to libraries
✓ Repeat listening increasing
✓ Playlist placement signals sending
✓ Track authority building

**YOUR ANALYTICS WILL SHOW:**
📊 Save rate improving
📊 Playlist additions increasing
📊 Repeat listener rate rising
📊 Algorithmic favor growing
📊 Revenue multiplying

**ACTIONABLE RESULTS YOU'LL USE:**
→ Track becoming staple in listeners' libraries
→ Playlist features increasing
→ Repeat plays driving revenue
→ Artist credibility rising
→ Music career advancing

**THE WIN:** Saves mean people love your music enough to save it. They're not one-time listeners—they're fans. They're coming back. That's career foundation.`,
    category: PLATFORMS.SPOTIFY,
    action: 'Likes',
    pricePerUnit: 180,
    minQuantity: 100,
    maxQuantity: 50000,
    speed: 'fast',
    refillable: true,
  },

  // ============ TWITCH ============
  {
    id: 'twitch_followers',
    name: 'Twitch Followers',
    description: `📺 **BUILD TWITCH CHANNEL WITH REAL FOLLOWER BASE**

Twitch followers get notified when you go live. Get 500-2,000 followers and build streaming audience that shows up automatically. Followers = recurring viewer base.

**WHAT YOU GET:**
✓ Real Twitch followers
✓ Active streaming viewers
✓ Live notification subscribers
✓ Recurring viewer base
✓ Channel authority building

**YOUR ANALYTICS WILL SHOW:**
📊 Live stream viewership increasing
📊 Average viewers per stream rising
📊 Channel authority building
📊 Partner eligibility getting closer
📊 Monetization opportunity growing

**ACTIONABLE RESULTS YOU'LL USE:**
→ Streams getting consistent viewers
→ Channel growing organically
→ Partner program eligibility approaching
→ Sponsorship opportunity emerging
→ Streaming career building

**THE WIN:** Twitch followers are live viewers. Every stream they show up. That's recurring audience. That's community. That's streaming career foundation.`,
    category: PLATFORMS.TWITCH,
    action: 'Followers',
    pricePerUnit: 210,
    minQuantity: 100,
    maxQuantity: 50000,
    speed: 'slow',
    refillable: true,
  },
  {
    id: 'twitch_views',
    name: 'Twitch Stream Views',
    description: `👀 **ESTABLISH TWITCH STREAM MOMENTUM WITH VIEWER BASE**

Views during streams trigger Twitch algorithm. Get 2,000-10,000 views and establish stream credibility. Higher viewer counts signal success to Twitch algorithm.

**WHAT YOU GET:**
✓ Real views during stream
✓ Viewer presence increasing
✓ Stream authority building
📊 Algorithm recognition
✓ Organic viewers following

**YOUR ANALYTICS WILL SHOW:**
📊 Stream visibility increasing
📊 Organic viewers multiplying
📊 Channel ranking improving
📊 Page recommendation improving
📊 Growth momentum visible

**ACTIONABLE RESULTS YOU'LL USE:**
→ Streams becoming visible on platform
→ Organic viewers increasing
→ Channel authority rising
→ Stream quality signal sending
→ Career momentum building

**THE WIN:** Live viewer counts are real-time validation. Watching viewers climb during stream is addictive. That's momentum. That's proof people want your content.`,
    category: PLATFORMS.TWITCH,
    action: 'Views',
    pricePerUnit: 90,
    minQuantity: 1000,
    maxQuantity: 500000,
    speed: 'fast',
    refillable: false,
  },
  {
    id: 'twitch_subs',
    name: 'Twitch Subscriptions',
    description: `💎 **UNLOCK TWITCH REVENUE WITH REAL SUBSCRIPTIONS**

Subscriptions are Twitch's monetization. Get 50-200 subscribers and start earning revenue directly. Each sub = recurring monthly income.

**WHAT YOU GET:**
✓ Real Twitch subscriptions
✓ Monthly recurring revenue
✓ Subscriber badges and benefits
✓ Channel revenue unlocking
✓ Partnership path accelerating

**YOUR ANALYTICS WILL SHOW:**
📊 Monthly revenue starting
📊 Partner program eligibility rising
📊 Channel authority doubling
📊 Sponsorship opportunity emerging
📊 Full-time streaming potential

**ACTIONABLE RESULTS YOU'LL USE:**
→ Earning consistent monthly income
→ Building sustainable streaming business
→ Attracting brand sponsors
→ Becoming full-time streamer
→ Building media empire

**THE WIN:** Subscriptions = REVENUE. Real money monthly. That's not just audience—that's income. That's turning streaming into profession.`,
    category: PLATFORMS.TWITCH,
    action: 'Subscriptions',
    pricePerUnit: 600,
    minQuantity: 50,
    maxQuantity: 10000,
    speed: 'slow',
    refillable: true,
  },
  {
    id: 'twitch_channel_points',
    name: 'Twitch Channel Points',
    description: `⭐ **BUILD CHANNEL ENGAGEMENT WITH TWITCH CHANNEL POINTS**

Channel points gamify engagement. Get 10,000-50,000 channel points activity and build community gamification. Points = recurring engagement and loyalty.

**WHAT YOU GET:**
✓ Real channel points activity
✓ Viewer engagement increasing
✓ Gamification driving participation
✓ Community building
✓ Loyalty increasing

**YOUR ANALYTICS WILL SHOW:**
📊 Viewer engagement multiplying
📊 Session time increasing
📊 Community participation rising
📊 Chat activity climbing
📊 Community loyalty building

**ACTIONABLE RESULTS YOU'LL USE:**
→ Community actively participating
→ Viewer loyalty increasing
→ Engagement becoming self-sustaining
→ Stream quality improving
→ Community becoming powerful

**THE WIN:** Channel points create engagement loops. People come back to earn points. That's community building. That's loyalty. That's recurring engagement.`,
    category: PLATFORMS.TWITCH,
    action: 'Channel Points',
    pricePerUnit: 200,
    minQuantity: 10000,
    maxQuantity: 500000,
    speed: 'medium',
    refillable: true,
  },
  {
    id: 'twitch_chat_comments',
    name: 'Twitch Chat Comments',
    description: `💬 **CREATE ACTIVE CHAT DURING STREAMS**

Active chat makes streams feel alive. Get 100-300 chat messages and make streams feel populated and engaging. Active chat = better viewer experience = better retention.

**WHAT YOU GET:**
✓ Real chat messages from viewers
✓ Relevant, contextual comments
✓ Chat activity creating energy
✓ Stream vibe improving
📊 Viewer retention increasing

**YOUR ANALYTICS WILL SHOW:**
📊 Chat activity visible
📊 Viewer engagement higher
📊 Stream quality improved
📊 Retention metrics rising
📊 Organic chat activity increasing

**ACTIONABLE RESULTS YOU'LL USE:**
→ Streams feeling alive and engaging
→ Viewers wanting to participate
📊 Better stream experience overall
→ Viewer retention improving
→ Community building authentically

**THE WIN:** Active chat makes streaming FUN. Dialogue with audience is why streaming matters. Active chat = community. That's the real appeal of streaming.`,
    category: PLATFORMS.TWITCH,
    action: 'Chat Comments',
    pricePerUnit: 220,
    minQuantity: 100,
    maxQuantity: 10000,
    speed: 'medium',
    refillable: false,
  },

  // ============ SNAPCHAT ============
  {
    id: 'snapchat_followers',
    name: 'Snapchat Followers',
    description: `👻 **GROW YOUR SNAPCHAT PRESENCE WITH REAL NIGERIAN FOLLOWERS**

Snapchat rewards accounts with momentum. Get 100–1,000 real followers and boost your Snap Score, story visibility, and overall account authority. Real accounts means real snap streaks and authentic engagement.

**WHAT YOU GET:**
✓ Real Nigerian Snapchat followers (active accounts)
✓ Gradual delivery over 24–48 hours
✓ Followers who can view your stories and snaps
✓ Permanent — no ghost drops
✓ Boosts your Snap Score and social proof

**YOUR ANALYTICS WILL SHOW:**
📊 Story views increasing as follower base grows
📊 Snap Score rising naturally
📊 More replies to your snaps
📊 Better brand perception (high followers = credibility)
📊 More DMs and engagement from organic users

**ACTIONABLE RESULTS YOU'LL USE:**
→ Build credibility for your brand or personal account
→ Attract business inquiries via Snapchat DMs
→ Grow your Nigerian audience for product launches
→ Increase story reach to broader circles
→ Qualify for Snapchat creator monetization

**THE WIN:** Every new follower is a real person who chose to connect with you. That's not a number — that's your audience showing up.`,
    category: PLATFORMS.SNAPCHAT,
    action: 'Followers',
    pricePerUnit: 5000,
    minQuantity: 100,
    maxQuantity: 20000,
    speed: 'medium',
    refillable: true,
  },
  {
    id: 'snapchat_story_views',
    name: 'Snapchat Story Views',
    description: `👀 **MAXIMIZE YOUR 24-HOUR WINDOW WITH REAL STORY VIEWS**

Stories disappear in 24 hours — so timing is everything. Get 500–5,000 real views on your Snapchat stories and make every post count. High view counts push your story to the top of your followers' feeds.

**WHAT YOU GET:**
✓ Real views from active Nigerian Snapchat users
✓ Views counted within 1–3 hours
✓ Works on photos, videos, and multi-slide stories
✓ Boosts your story ranking in followers' feeds
✓ Permanent view count (no reversals)

**YOUR ANALYTICS WILL SHOW:**
📊 Stories appearing higher in followers' queues
📊 More organic replies and DM reactions
📊 Screenshot rates increasing
📊 Story reach growing beyond just followers
📊 Snap Score and account activity metrics rising

**ACTIONABLE RESULTS YOU'LL USE:**
→ Product/service announcements reaching maximum eyes
→ Flash sales and promos getting instant visibility
→ Personal updates building stronger connections
→ Behind-the-scenes content driving engagement
→ Event announcements reaching audience in time

**THE WIN:** Posting a story and watching the views climb in real time is addictive validation. Your content matters. People are watching.`,
    category: PLATFORMS.SNAPCHAT,
    action: 'Story Views',
    pricePerUnit: 1000,
    minQuantity: 500,
    maxQuantity: 100000,
    speed: 'fast',
    refillable: false,
  },
  {
    id: 'snapchat_saves',
    name: 'Snapchat Saves',
    description: `🔖 **THE SIGNAL THAT SAYS YOUR CONTENT IS WORTH KEEPING**

When someone saves your snap, they're saying "this is too good to lose." Get 100–500 saves and show Snapchat's algorithm that your content has lasting value — meaning more people get shown your snaps organically.

**WHAT YOU GET:**
✓ Real saves from active Nigerian Snapchat users
✓ Saves spread over 2–4 hours naturally
✓ Works on photos, videos, and spotlight content
✓ Signals high content quality to algorithm
✓ Permanent saves with no reversals

**YOUR ANALYTICS WILL SHOW:**
📊 Content being re-shared and re-viewed
📊 Algorithm favouring your content in recommendations
📊 Snap spotlight exposure increasing
📊 Saves creating long-tail content views
📊 Audience retention improving

**ACTIONABLE RESULTS YOU'LL USE:**
→ Tutorials and how-to content becoming reference material
→ Educational content getting saved for later review
→ Product demos being shared in group chats
→ Inspirational content saving as wallpapers
→ Your snaps appearing in "saved" collections

**THE WIN:** Saves mean your content has value beyond the moment. It's worth keeping. That's not just engagement — that's impact.`,
    category: PLATFORMS.SNAPCHAT,
    action: 'Saves',
    pricePerUnit: 3000,
    minQuantity: 100,
    maxQuantity: 50000,
    speed: 'medium',
    refillable: true,
  },
  {
    id: 'snapchat_shares',
    name: 'Snapchat Shares',
    description: `↗️ **YOUR CONTENT SPREADING THROUGH NIGERIAN SNAPCHAT NETWORKS**

Sharing on Snapchat means your content reaches networks you've never touched. Get 50–500 shares and watch your snap spread through friend groups, family chats, and communities across Nigeria.

**WHAT YOU GET:**
✓ Real shares from genuine Nigerian Snapchat users
✓ Shares to stories, DMs, and group chats
✓ Each share reaching entirely new audiences
✓ Viral cascade effect across Nigerian networks
✓ Permanent record of shares

**YOUR ANALYTICS WILL SHOW:**
📊 Reach exploding beyond your follower count
📊 New follower requests from share discovery
📊 Content reaching groups you don't follow
📊 DM volume increasing from share exposure
📊 Brand awareness spreading organically

**ACTIONABLE RESULTS YOU'LL USE:**
→ Announcements spreading like wildfire
→ Promotions reaching thousands via group chats
→ Content going viral in Nigerian communities
→ Word-of-mouth marketing at scale
→ Brand recognition growing organically

**THE WIN:** A share is the highest compliment. Someone thought your content was so good, so important, so funny — that they had to share it. That's influence at its most authentic.`,
    category: PLATFORMS.SNAPCHAT,
    action: 'Shares',
    pricePerUnit: 4000,
    minQuantity: 50,
    maxQuantity: 10000,
    speed: 'medium',
    refillable: true,
  },
  {
    id: 'snapchat_views',
    name: 'Snapchat Spotlight Views',
    description: `🎬 **GO VIRAL ON SNAPCHAT SPOTLIGHT WITH REAL VIEW MOMENTUM**

Snapchat Spotlight is Snapchat's answer to TikTok — and it pays creators. Get 1,000–10,000 real views on your Spotlight content and trigger Snapchat's algorithm to push your video to thousands more. Early view velocity decides which Spotlights go viral.

**WHAT YOU GET:**
✓ Real views from active Nigerian Snapchat users
✓ Fast delivery matching organic view patterns
✓ Counts toward Spotlight creator earnings eligibility
✓ Triggers algorithm to show to more users
✓ Permanent view count

**YOUR ANALYTICS WILL SHOW:**
📊 Spotlight video getting shown to exponentially more users
📊 Creator fund earnings potential increasing
📊 Profile visits spiking from Spotlight discovery
📊 Followers growing from Spotlight exposure
📊 Subsequent Spotlights performing better

**ACTIONABLE RESULTS YOU'LL USE:**
→ Entertainment content reaching millions
→ Creator fund income becoming real possibility
→ Brand building through viral Spotlight content
→ Comedy and trending content going massive
→ Tutorials reaching audience who needs them

**THE WIN:** Snapchat Spotlight literally pays you when your content performs. Real views mean real potential for real income. That's not just engagement — that's your content working for you.`,
    category: PLATFORMS.SNAPCHAT,
    action: 'Views',
    pricePerUnit: 1000,
    minQuantity: 1000,
    maxQuantity: 500000,
    speed: 'fast',
    refillable: false,
  },

  // ============ FACEBOOK ============
  {
    id: 'fb_page_likes',
    name: 'Facebook Page Likes',
    description: `👍 **GROW YOUR FACEBOOK PAGE WITH REAL NIGERIAN FANS**\n\nGet real, active Nigerians to like your Facebook Page. Page likes signal credibility and help you reach more people organically through Facebook's algorithm.\n\n✓ Real Nigerian Facebook users who like your page\n✓ Steady delivery over 24-48 hours\n✓ Permanent likes with refill guarantee\n✓ Boosts your page's organic reach\n✓ More visible in Facebook search results`,
    category: PLATFORMS.FACEBOOK,
    action: 'Page Likes',
    pricePerUnit: 5000,
    minQuantity: 100,
    maxQuantity: 50000,
    speed: 'medium',
    refillable: true,
  },
  {
    id: 'fb_followers',
    name: 'Facebook Profile Followers',
    description: `👥 **BUILD YOUR FACEBOOK FOLLOWING WITH REAL NIGERIANS**\n\nGet real Nigerian users to follow your personal Facebook profile or public figure page. Natural pacing, permanent followers.\n\n✓ Genuine Nigerian Facebook followers\n✓ Natural pacing — 50-200 per day\n✓ Permanent followers, no drop guarantee\n✓ Works for personal profiles and public pages`,
    category: PLATFORMS.FACEBOOK,
    action: 'Followers',
    pricePerUnit: 5000,
    minQuantity: 100,
    maxQuantity: 30000,
    speed: 'medium',
    refillable: true,
  },
  {
    id: 'fb_post_likes',
    name: 'Facebook Post Likes',
    description: `❤️ **INSTANT LIKES ON ANY FACEBOOK POST**\n\nGet real likes on your Facebook posts, photos, and videos. High engagement tells Facebook's algorithm to show your content to more people.\n\n✓ Real Nigerian Facebook users liking your post\n✓ Fast delivery — most within 1-2 hours\n✓ Works on posts, photos, videos, Reels\n✓ Permanent likes`,
    category: PLATFORMS.FACEBOOK,
    action: 'Likes',
    pricePerUnit: 3000,
    minQuantity: 50,
    maxQuantity: 50000,
    speed: 'fast',
    refillable: true,
  },
  {
    id: 'fb_comments',
    name: 'Facebook Post Comments',
    description: `💬 **SPARK REAL CONVERSATIONS ON YOUR POSTS**\n\nGet genuine, relevant comments on your Facebook posts from real Nigerian users.\n\n✓ Real, contextually relevant comments\n✓ Natural delivery over 2-4 hours\n✓ Comments match your content topic\n✓ Permanent — never removed`,
    category: PLATFORMS.FACEBOOK,
    action: 'Comments',
    pricePerUnit: 5000,
    minQuantity: 10,
    maxQuantity: 5000,
    speed: 'medium',
    refillable: false,
  },
  {
    id: 'fb_shares',
    name: 'Facebook Post Shares',
    description: `🔄 **GET YOUR CONTENT SHARED ACROSS FACEBOOK**\n\nShares are Facebook's most powerful engagement metric. Real users sharing your post triggers massive organic reach.\n\n✓ Real Nigerian users sharing your post\n✓ Steady delivery over 24-48 hours\n✓ Each share reaches new audiences\n✓ Maximum viral potential`,
    category: PLATFORMS.FACEBOOK,
    action: 'Shares',
    pricePerUnit: 4000,
    minQuantity: 10,
    maxQuantity: 10000,
    speed: 'medium',
    refillable: false,
  },
  {
    id: 'fb_video_views',
    name: 'Facebook Video Views',
    description: `▶️ **BOOST YOUR FACEBOOK VIDEO VIEWS**\n\nGet real views on your Facebook videos and Reels. High view counts encourage organic viewers to watch and engage.\n\n✓ Real views from genuine Nigerian Facebook users\n✓ Fast delivery — starts within hours\n✓ Works on all Facebook video formats\n✓ Improves video ranking in Facebook feeds`,
    category: PLATFORMS.FACEBOOK,
    action: 'Video Views',
    pricePerUnit: 1000,
    minQuantity: 500,
    maxQuantity: 1000000,
    speed: 'fast',
    refillable: false,
  },
  {
    id: 'fb_group_members',
    name: 'Facebook Group Members',
    description: `👥 **GROW YOUR FACEBOOK GROUP FAST**\n\nGet real Nigerian members to join your Facebook Group. A large, active group signals authority in your niche.\n\n✓ Real Nigerian users joining your group\n✓ Natural growth pacing over 3-5 days\n✓ Members who stay (low drop rate)\n✓ Works for public and private groups`,
    category: PLATFORMS.FACEBOOK,
    action: 'Group Members',
    pricePerUnit: 5000,
    minQuantity: 100,
    maxQuantity: 20000,
    speed: 'slow',
    refillable: true,
  },
];

// ── Central pricing (in kobo) by action type — single source of truth ──
// Agreed model: Followers ₦50, Likes ₦30, Views ₦10, Subscribers ₦100,
// Comments ₦50, Shares ₦40, Saves ₦30, Channel Points ₦10. (₦1 = 100 kobo)
export const ACTION_PRICE_KOBO: Record<string, number> = {
  // Followers / subscriber types
  'Followers': 5000,
  'Channel Followers': 5000,
  'Subscribers': 10000,
  'Subscriptions': 10000,
  // Like types
  'Likes': 3000,
  'Comment Likes': 3000,
  'Reactions': 3000,
  'Message Reactions': 3000,
  'Saves': 3000,
  'Bookmarks': 3000,
  // View types
  'Views': 1000,
  'Story Views': 1000,
  'Reel Views': 1000,
  'Post Views': 1000,
  'Message Views': 1000,
  'Plays': 1000,
  'Channel Points': 1000,
  // Comment types
  'Comments': 5000,
  'Replies': 5000,
  'Chat Comments': 5000,
  // Share types
  'Shares': 4000,
  'Retweets': 4000,
  'Quote Tweets': 4000,
  'Repins': 4000,
};

// Apply central pricing + quantity limits to every service at module load time.
// Done once here; SERVICES_CATALOG is the authoritative source for all code.
const GLOBAL_MIN_QTY = 10;
const GLOBAL_MAX_QTY = 10000;

(() => {
  for (const service of SERVICES_CATALOG) {
    const price = ACTION_PRICE_KOBO[service.action];
    if (price !== undefined) service.pricePerUnit = price;
    // Enforce global quantity limits across all services
    service.minQuantity = GLOBAL_MIN_QTY;           // min = 10 for all
    service.maxQuantity = Math.min(GLOBAL_MAX_QTY, service.maxQuantity); // cap at 10,000
  }
})();

// Fee model: Platform 7.5% + VAT 7.5% (= 15% total) on the base price.
export const PLATFORM_FEE_RATE = 0.075;
export const VAT_RATE = 0.075;

export interface PricingBreakdown {
  baseKobo: number;
  platformFeeKobo: number;
  vatKobo: number;
  totalKobo: number;
}

/** Compute the full order pricing breakdown (kobo). Shared by UI + backend. */
export function computePricing(pricePerUnitKobo: number, quantity: number): PricingBreakdown {
  const baseKobo = pricePerUnitKobo * quantity;
  const platformFeeKobo = Math.ceil(baseKobo * PLATFORM_FEE_RATE);
  const vatKobo = Math.ceil(baseKobo * VAT_RATE);
  return { baseKobo, platformFeeKobo, vatKobo, totalKobo: baseKobo + platformFeeKobo + vatKobo };
}

export function getServicesByCategory(category: string): Service[] {
  return SERVICES_CATALOG.filter(service => service.category === category);
}

export function getServiceById(serviceId: string): Service | undefined {
  return SERVICES_CATALOG.find(service => service.id === serviceId);
}

export function getCategoriesWithServices() {
  const categories = new Map<string, Service[]>();

  SERVICES_CATALOG.forEach(service => {
    if (!categories.has(service.category)) {
      categories.set(service.category, []);
    }
    categories.get(service.category)!.push(service);
  });

  return categories;
}

export function getPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    [PLATFORMS.INSTAGRAM]: 'Instagram',
    [PLATFORMS.TWITTER]: 'Twitter (X)',
    [PLATFORMS.YOUTUBE]: 'YouTube',
    [PLATFORMS.TIKTOK]: 'TikTok',
    [PLATFORMS.SNAPCHAT]: 'Snapchat',
    [PLATFORMS.SPOTIFY]: 'Spotify',
    [PLATFORMS.WHATSAPP]: 'WhatsApp',
    [PLATFORMS.PINTEREST]: 'Pinterest',
    [PLATFORMS.THREADS]: 'Threads',
    [PLATFORMS.TELEGRAM]: 'Telegram',
    [PLATFORMS.FACEBOOK]: 'Facebook',
    [PLATFORMS.TWITCH]: 'Twitch',
  };

  return labels[platform] || platform;
}
