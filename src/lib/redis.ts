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
