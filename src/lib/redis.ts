import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL;
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redisUrl) {
    console.warn('REDIS_URL not set, caching disabled');
    return null;
  }

  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = createClient({ url: redisUrl });
    await redisClient.connect();
    console.log('Redis connected');
    return redisClient;
  } catch (error) {
    console.error('Redis connection error:', error);
    return null;
  }
}

export async function getCachedWallet(userId: string) {
  const client = await getRedisClient();
  if (!client) return null;

  try {
    const cached = await client.get(`wallet:${userId}`);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function setCachedWallet(userId: string, data: any, ttl: number = 300) {
  const client = await getRedisClient();
  if (!client) return;

  try {
    await client.setEx(`wallet:${userId}`, ttl, JSON.stringify(data));
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

export async function invalidateWalletCache(userId: string) {
  const client = await getRedisClient();
  if (!client) return;

  try {
    await client.del(`wallet:${userId}`);
  } catch (error) {
    console.error('Cache invalidate error:', error);
  }
}

export async function getCachedOrders(userId: string) {
  const client = await getRedisClient();
  if (!client) return null;

  try {
    const cached = await client.get(`orders:${userId}`);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function setCachedOrders(userId: string, data: any, ttl: number = 300) {
  const client = await getRedisClient();
  if (!client) return;

  try {
    await client.setEx(`orders:${userId}`, ttl, JSON.stringify(data));
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

export async function invalidateOrdersCache(userId: string) {
  const client = await getRedisClient();
  if (!client) return;

  try {
    await client.del(`orders:${userId}`);
  } catch (error) {
    console.error('Cache invalidate error:', error);
  }
}

export async function getCachedService(serviceId: string) {
  const client = await getRedisClient();
  if (!client) return null;

  try {
    const cached = await client.get(`service:${serviceId}`);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function setCachedService(serviceId: string, data: any, ttl: number = 3600) {
  const client = await getRedisClient();
  if (!client) return;

  try {
    await client.setEx(`service:${serviceId}`, ttl, JSON.stringify(data));
  } catch (error) {
    console.error('Cache set error:', error);
  }
}
