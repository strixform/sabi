import { NextRequest, NextResponse } from 'next/server';

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function getRateLimitKey(req: NextRequest, identifier?: string): string {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  return identifier ? `${ip}:${identifier}` : ip;
}

export function checkRateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const data = rateLimitStore.get(key);

  if (!data || now > data.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  if (data.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: data.resetTime };
  }

  data.count += 1;
  return { allowed: true, remaining: maxRequests - data.count, resetTime: data.resetTime };
}

export function rateLimitResponse(
  maxRequests: number,
  resetTime: number
): NextResponse {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  return NextResponse.json(
    {
      error: 'Too many requests. Please try again later.',
      retryAfter,
    },
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
