import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';

// Lazy-initialised Redis client for rate limiting
let _redisClient: ReturnType<typeof createClient> | null = null;

async function getRateLimitRedis() {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  // Return existing connected client
  if (_redisClient?.isOpen) return _redisClient;

  // Reset stale client
  _redisClient = null;

  try {
    const client = createClient({ url });

    // Catch connection errors so they don't become uncaught exceptions
    // that crash the Vercel function. On any error we reset and reconnect
    // on the next request.
    client.on('error', () => { _redisClient = null; });
    client.on('end', () => { _redisClient = null; });

    await client.connect();
    _redisClient = client;
    return _redisClient;
  } catch {
    _redisClient = null;
    return null;
  }
}

// ─── Redis-backed rate limiter ────────────────────────────────────────────────
// Uses Redis INCR + EXPIRE for atomic, distributed counting that survives
// serverless cold starts. Falls back to in-memory if Redis is unavailable.

const fallbackStore = new Map<string, { count: number; resetTime: number }>();

export function getRateLimitKey(req: NextRequest, identifier?: string): string {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  return identifier ? `rl:${ip}:${identifier}` : `rl:${ip}`;
}

export async function checkRateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const windowSecs = Math.ceil(windowMs / 1000);
  const resetTime = Date.now() + windowMs;

  try {
    const redis = await getRateLimitRedis();

    if (redis) {
      // Atomic increment — works correctly even with concurrent requests
      const count = await (redis as any).incr(key);

      if (count === 1) {
        // First request in this window — set expiry
        await (redis as any).expire(key, windowSecs);
      }

      // Get actual TTL for accurate resetTime
      const ttl = await (redis as any).ttl(key);
      const actualReset = Date.now() + (ttl > 0 ? ttl * 1000 : windowMs);

      if (count > maxRequests) {
        return { allowed: false, remaining: 0, resetTime: actualReset };
      }

      return { allowed: true, remaining: Math.max(0, maxRequests - count), resetTime: actualReset };
    }
  } catch (err) {
    console.warn('[RateLimit] Redis error, falling back to memory:', (err as Error).message);
  }

  // ── In-memory fallback ──────────────────────────────────────────────────────
  const now = Date.now();
  const data = fallbackStore.get(key);

  if (!data || now > data.resetTime) {
    fallbackStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  if (data.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: data.resetTime };
  }

  data.count += 1;
  return { allowed: true, remaining: maxRequests - data.count, resetTime: data.resetTime };
}

export function rateLimitResponse(maxRequests: number, resetTime: number): NextResponse {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.', retryAfter },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
      },
    }
  );
}
