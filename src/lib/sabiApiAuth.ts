import type { NextRequest } from 'next/server';
import { getSabiSession } from './sabiAuth';
import { verifySabiApiKey } from './sabiApiKey';
import { checkRateLimit } from './rateLimit';

export interface SabiCaller { id: string; email: string; viaApiKey: boolean }

/**
 * Per-key rate limit for programmatic API traffic. Only applies to Bearer-key callers (the web
 * app has its own IP limits) so one key can't hammer the API. Returns { allowed, resetTime };
 * the route replies with rateLimitResponse(limit, resetTime) when not allowed.
 */
export async function apiRateLimit(caller: SabiCaller, action = 'api', limit = 60, windowMs = 60000): Promise<{ allowed: boolean; resetTime: number }> {
  if (!caller.viaApiKey) return { allowed: true, resetTime: 0 };
  return checkRateLimit(`sabi-api:${action}:${caller.id}`, limit, windowMs);
}

/**
 * Resolve the caller for a SABI endpoint from EITHER:
 *   - an `Authorization: Bearer sabi_<keyId>_<token>` API key (programmatic use, as the docs say), OR
 *   - the logged-in session cookie (the web app).
 *
 * This is what makes the public API actually usable — the documented endpoints used to check the
 * session cookie only, so a Bearer key always 401'd. A malformed/expired key returns null (401),
 * it never silently falls through to the session.
 */
export async function resolveSabiCaller(req: NextRequest): Promise<SabiCaller | null> {
  const auth = req.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(sabi_[^\s]+)$/i);
  if (m) {
    const r = await verifySabiApiKey(m[1]);
    if (r?.userId) return { id: r.userId, email: (r.user as any)?.email || '', viaApiKey: true };
    return null; // key was supplied but invalid/expired — do NOT fall back to session
  }
  const s = await getSabiSession();
  return s ? { id: s.id, email: s.email, viaApiKey: false } : null;
}
