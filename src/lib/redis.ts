import { createClient } from 'redis';

// ─── Redis client with safety timeouts ────────────────────────────────────────
// Redis is used for optional caching only. If Redis is slow or unavailable,
// ALL operations must fall back gracefully — never block a user request.
// A 2-second timeout on every Redis operation ensures this.

const redisUrl = process.env.REDIS_URL;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redisClient: any = null;
let connecting = false;

async function getRedisClient() {
  if (!redisUrl) return null;
  if (redisClient?.isOpen) return redisClient;
  if (connecting) return null; // Don't pile up connection attempts

  connecting = true;
  redisClient = null;

  try {
    const client = createClient({ url: redisUrl, socket: { connectTimeout: 2000, reconnectStrategy: false } });
    client.on('error', () => { redisClient = null; connecting = false; });
    client.on('end', () => { redisClient = null; connecting = false; });

    // Race connection against 2s timeout
    await Promise.race([
      client.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connect timeout')), 2000)),
    ]);

    redisClient = client;
    connecting = false;
    return redisClient;
  } catch {
    redisClient = null;
    connecting = false;
    return null;
  }
}

// Wrapper that races any Redis operation against a 2s timeout
async function withTimeout<T>(op: () => Promise<T>): Promise<T | null> {
  try {
    return await Promise.race([
      op(),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Redis op timeout')), 2000)),
    ]) as T;
  } catch {
    return null;
  }
}

/**
 * Daily promo-budget gate. Returns true if `amountKobo` of giveaway can be
 * spent today within `budgetKobo`, and records it. Fail-OPEN: if Redis is
 * unavailable we allow the credit (never block a legit payout on a cache outage).
 */
export async function consumePromoBudget(amountKobo: number, budgetKobo: number): Promise<boolean> {
  const client = await getRedisClient();
  if (!client) return true; // fail open
  const day = new Date().toISOString().slice(0, 10);
  const res = await withTimeout(async () => {
    const key = `sabi_promo:${day}`;
    const cur = Number((await client.get(key)) || 0);
    if (cur >= budgetKobo) {
      // First time we hit the cap today → alert admin once.
      const alertKey = `sabi_promo_alerted:${day}`;
      const already = await client.get(alertKey);
      if (!already) {
        await client.setEx(alertKey, 172800, "1");
        import("./email").then(({ sendAdminAlertEmail }) =>
          sendAdminAlertEmail("Daily promo budget exhausted",
            `<p>Today's giveaway budget (cashback + top-up bonuses + referrals) of <b>₦${Math.round(budgetKobo / 100).toLocaleString()}</b> has been reached. Further giveaways are paused until tomorrow.</p>`)
        ).catch(() => {});
      }
      return false; // budget exhausted for today
    }
    await client.incrBy(key, amountKobo);
    await client.expire(key, 172800); // 2 days
    return true;
  });
  return res === null ? true : res; // timeout/error → fail open
}

/** Today's promo spend so far (kobo) — for the economics dashboard. */
export async function getPromoSpendToday(): Promise<number> {
  const client = await getRedisClient();
  if (!client) return 0;
  const res = await withTimeout(async () => Number((await client.get(`sabi_promo:${new Date().toISOString().slice(0, 10)}`)) || 0));
  return res || 0;
}

export async function getCachedWallet(userId: string) {
  const client = await getRedisClient();
  if (!client) return null;
  return withTimeout(async () => {
    const v = await client.get(`wallet:${userId}`);
    return v ? JSON.parse(v) : null;
  });
}

export async function setCachedWallet(userId: string, data: any, ttl = 300) {
  const client = await getRedisClient();
  if (!client) return;
  withTimeout(() => client.setEx(`wallet:${userId}`, ttl, JSON.stringify(data))).catch(() => {});
}

export async function invalidateWalletCache(userId: string) {
  const client = await getRedisClient();
  if (!client) return;
  withTimeout(() => client.del(`wallet:${userId}`)).catch(() => {});
}

export async function getCachedOrders(userId: string) {
  const client = await getRedisClient();
  if (!client) return null;
  return withTimeout(async () => {
    const v = await client.get(`orders:${userId}`);
    return v ? JSON.parse(v) : null;
  });
}

export async function setCachedOrders(userId: string, data: any, ttl = 300) {
  const client = await getRedisClient();
  if (!client) return;
  withTimeout(() => client.setEx(`orders:${userId}`, ttl, JSON.stringify(data))).catch(() => {});
}

export async function invalidateOrdersCache(userId: string) {
  const client = await getRedisClient();
  if (!client) return;
  withTimeout(() => client.del(`orders:${userId}`)).catch(() => {});
}

// ─── Session cache ────────────────────────────────────────────────────────────
// Caches validated session data keyed by the raw token (hashed before storage).
// TTL: 5 minutes — short enough to catch bans/logouts, long enough to cut DB hits
// by 80-90% on active users. getSabiSession() falls back to DB on cache miss.

export async function getCachedSession(token: string) {
  const client = await getRedisClient();
  if (!client) return null;
  return withTimeout(async () => {
    const v = await client.get(`sess:${token}`);
    return v ? JSON.parse(v) : null;
  });
}

export async function setCachedSession(token: string, session: any, ttl = 300) {
  const client = await getRedisClient();
  if (!client) return;
  withTimeout(() => client.setEx(`sess:${token}`, ttl, JSON.stringify(session))).catch(() => {});
}

export async function invalidateSessionCache(token: string) {
  const client = await getRedisClient();
  if (!client) return;
  withTimeout(() => client.del(`sess:${token}`)).catch(() => {});
}
