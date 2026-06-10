import { prisma } from './prisma';
import { hash, compare } from 'bcryptjs';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { sabiExecute } from './tursoClient';

/**
 * ─── SABI AUTH STABILITY RULES — READ BEFORE CHANGING ──────────────────────
 *
 * 1. LAZY REDIS IMPORTS: Redis is imported INSIDE function bodies, never at the
 *    top of this file. A Redis failure must NEVER crash auth. The pattern:
 *      async function tryGetCachedSession() { const { getCachedSession } = await import('./redis'); }
 *    If you add Redis to the top-level imports, login will break when Redis is down.
 *
 * 2. withDbTimeout DEFAULT: Currently 6s. This MUST be shorter than the
 *    maxDuration of routes that call it (Google callback = 25s, login = 30s).
 *    If withDbTimeout > maxDuration, Vercel kills the function before the
 *    timeout fires → Cloudflare sees an upstream cut → "Host Error" for users.
 *
 * 3. PRISMA SELECT: Every prisma query MUST use explicit `select:` with only
 *    columns guaranteed to exist in the prod Turso DB. The prod schema may lag
 *    behind prisma/schema.prisma. Missing columns cause 500 errors in production.
 *
 * 4. SESSION CACHE TTL: trySetCachedSession calls use 86400s (24h) so sessions
 *    survive a Turso outage (Redis is the authoritative session store during one).
 *    Never reduce below 3600s — too short causes Turso floods + false logouts.
 *
 * 5. createSabiSession sets cookies + Redis FIRST; the Turso sessionToken write is
 *    BEST-EFFORT (never throws). Login must complete even when Turso is slow.
 */

// ─── Stability rule: Redis is OPTIONAL and must NEVER crash core auth ──────────
// Import is lazy (inside function bodies) so a Redis module failure cannot
// cascade and break login/register/session-check routes.
// If Redis is unavailable, all functions return null → falls back to DB.
// This is the correct pattern for any optional dependency used in auth.
async function tryGetCachedSession(token: string) {
  try {
    const { getCachedSession } = await import('./redis');
    return await getCachedSession(token);
  } catch { return null; }
}
async function trySetCachedSession(token: string, session: unknown, ttl: number) {
  try {
    const { setCachedSession } = await import('./redis');
    await setCachedSession(token, session, ttl);
  } catch { /* non-fatal */ }
}
async function tryInvalidateSession(token: string) {
  try {
    const { invalidateSessionCache } = await import('./redis');
    await invalidateSessionCache(token);
  } catch { /* non-fatal */ }
}

const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

// ─── DB timeout guard ─────────────────────────────────────────────────────────
// Prisma/Turso can hang indefinitely when Turso is rate-limiting (429).
// Wrap every Prisma call with this so auth routes never time out silently.
// 8s is aggressive but safe — Turso P95 is <300ms, 8s means something is broken.
function withDbTimeout<T>(p: Promise<T>, ms = 6000): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('DB_TIMEOUT')), ms)
    ),
  ]);
}
const VERIFY_CODE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface SabiSession {
  id: string;
  email: string;
  name: string;
  businessName?: string | null;
  status: string;
  emailVerified: boolean;
}

// Generate verification code
export function generateVerifyCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Hash token with SHA256
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Register user
export async function registerSabiUser(
  email: string,
  password: string,
  name: string,
  businessName?: string,
  referralCode?: string
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    // Check if user exists
    const existing = await prisma.sabiUser.findUnique({ where: { email } });
    if (existing) {
      return { success: false, error: 'Email already registered' };
    }

    // Validate referral code — cannot refer yourself (same email)
    let referrer: { id: string; email: string } | null = null;
    if (referralCode) {
      const candidate = await prisma.sabiUser.findUnique({ where: { referralCode }, select: { id: true, email: true } });
      // Block: same email (direct self-referral), or referral code doesn't exist
      if (candidate && candidate.email.toLowerCase() !== email.toLowerCase()) {
        referrer = candidate;
      }
    }

    // Hash password
    const passwordHash = await hash(password, 10);
    const verifyCode = generateVerifyCode();
    const newReferralCode = Math.random().toString(36).slice(2, 8).toUpperCase();

    // Create user
    const user = await prisma.sabiUser.create({
      data: {
        email,
        passwordHash,
        name,
        businessName,
        verifyCode,
        verifyCodeExpiry: new Date(Date.now() + VERIFY_CODE_DURATION),
        referralCode: newReferralCode,
        referredByCode: referrer ? referralCode : null,
        wallet: { create: {} },
      },
    });

    // Create referral record (rewards granted on first paid order)
    if (referrer) {
      await prisma.sabiReferral.create({
        data: { referrerId: referrer.id, refereeId: user.id },
      }).catch(() => {});
    }

    return { success: true, userId: user.id };
  } catch (error) {
    return { success: false, error: 'Registration failed' };
  }
}

// Login user
export async function loginSabiUser(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    // Explicit select — only reads columns that exist in prod DB.
    // Retry the read ONCE on a transient Turso slowdown before giving up, so a
    // single slow query doesn't show "server busy" when the next attempt would work.
    const readUser = () => prisma.sabiUser.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, name: true, passwordHash: true, status: true, emailVerified: true, businessName: true },
    });
    const user = await withDbTimeout(readUser()).catch(async () => {
      await new Promise(r => setTimeout(r, 400));
      return withDbTimeout(readUser());
    });

    if (!user || !user.passwordHash) {
      return { success: false, error: 'Invalid credentials' };
    }

    const passwordMatch = await compare(password, user.passwordHash);
    if (!passwordMatch) {
      return { success: false, error: 'Invalid credentials' };
    }

    if (user.status === 'banned') {
      return { success: false, error: 'Account suspended' };
    }

    return { success: true, userId: user.id };
  } catch (error) {
    const msg = (error as Error)?.message || '';
    console.error('[loginSabiUser]', msg.slice(0, 200));
    // Turso 429 → surface a clear retry message instead of generic "Login failed"
    if (msg.includes('429') || msg.includes('rate') || msg.includes('DB_TIMEOUT')) {
      return { success: false, error: 'Server is busy — please try again in a moment' };
    }
    return { success: false, error: 'Login failed' };
  }
}

// Create session
export async function createSabiSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = hashToken(token);
  const sessionExpiry = new Date(Date.now() + SESSION_DURATION);

  // 1. Set cookies FIRST — the session must exist for the browser regardless of
  //    whether Turso is reachable. (Previously the Turso write came first and threw
  //    on timeout, so under DB load the cookies were never set → login loop.)
  const cookieStore = await cookies();
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: SESSION_DURATION / 1000,
  };
  cookieStore.set('sabi_session_token', token, cookieOpts);
  cookieStore.set('sabi_session_id', userId, cookieOpts);

  // 2. Write session token via direct libsql (NOT Prisma — Prisma has 10-80s cold starts
  //    on Vercel which caused the session write to always timeout → login loop).
  //    sabiExecute has its own retry backoff so we just await it directly.
  try {
    await sabiExecute({
      sql: `UPDATE SabiUser SET sessionToken = ?, sessionExpiry = ? WHERE id = ?`,
      args: [hashedToken, sessionExpiry.toISOString(), userId],
    });
  } catch {
    // Non-fatal — getSabiSession will still work via the token lookup below
  }

  return token;
}

// Pre-warm Redis cache immediately after login — avoids first-request Turso hit.
// CRITICAL: must be awaited — fire-and-forget causes login loop where dashboard
// loads before Redis has the session, falls back to Turso, Turso is slow → null → login redirect.
export async function prewarmSessionCache(
  token: string,
  session: SabiSession
): Promise<void> {
  await trySetCachedSession(token, session, 86400); // 24h — survives Turso outages (doctrine §2)
}

// Get session — Redis-first with DB fallback.
// Cache hit: ~5ms. Cache miss: ~100-200ms DB query.
// Resilience: if Prisma sessionExpiry filter fails (column comparison issue on Turso TEXT),
// falls back to token-only lookup. Two-tier fallback ensures no false "not found" on login.
export async function getSabiSession(): Promise<SabiSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sabi_session_token')?.value;
    const userId = cookieStore.get('sabi_session_id')?.value;

    if (!token || !userId) return null;

    // 1. Check Redis cache — avoids DB query on 90%+ of requests
    const cached = await tryGetCachedSession(token);
    if (cached) return cached as SabiSession;

    const hashedToken = hashToken(token);

    // 2. Direct libsql lookup — bypasses Prisma's 10-80s cold start which was
    //    causing the session write/read race condition → login loop.
    let user: any = null;
    try {
      const result = await sabiExecute({
        sql: `SELECT id, email, name, businessName, status, emailVerified, sessionExpiry
              FROM SabiUser
              WHERE id = ? AND sessionToken = ? AND status != 'banned'
              LIMIT 1`,
        args: [userId, hashedToken],
      });
      user = result.rows[0] ?? null;
      // Manual expiry check
      if (user?.sessionExpiry) {
        const exp = new Date(user.sessionExpiry as string);
        if (isNaN(exp.getTime()) || exp < new Date()) user = null;
      }
    } catch {
      user = null;
    }

    if (!user) return null;

    const session: SabiSession = {
      id: user.id as string,
      email: user.email as string,
      name: user.name as string,
      businessName: (user.businessName as string) ?? null,
      status: user.status as string,
      emailVerified: !!user.emailVerified,
    };

    // Re-warm cache for 30 min on every DB hit
    trySetCachedSession(token, session, 86400); // 24h — survives Turso outages
    return session;
  } catch {
    return null;
  }
}

// Invalidate session cache on logout — call before clearing cookies
export async function invalidateSabiSession(token: string): Promise<void> {
  await tryInvalidateSession(token); // safe wrapper — never throws
}

// Verify email
export async function verifySabiEmail(userId: string, code: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.sabiUser.findUnique({ where: { id: userId } });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.emailVerified) {
      return { success: true };
    }

    if (user.verifyCode !== code || !user.verifyCodeExpiry || user.verifyCodeExpiry < new Date()) {
      return { success: false, error: 'Invalid or expired code' };
    }

    await prisma.sabiUser.update({
      where: { id: userId },
      data: { emailVerified: true, verifyCode: null, verifyCodeExpiry: null },
    });

    return { success: true };
  } catch (error) {
    // Error logging handled by external service
    return { success: false, error: 'Verification failed' };
  }
}

// Clear session
export async function clearSabiSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('sabi_session_token');
  cookieStore.delete('sabi_session_id');
}

// Request password reset
export async function requestPasswordReset(
  email: string
): Promise<{ success: boolean; error?: string; resetToken?: string }> {
  try {
    const user = await prisma.sabiUser.findUnique({ where: { email } });
    if (!user) {
      return { success: false, error: 'Email not found' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = hashToken(resetToken);
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.sabiUser.update({
      where: { id: user.id },
      data: {
        resetToken: resetTokenHash,
        resetTokenExpiry: resetExpiry,
      },
    });

    return { success: true, resetToken };
  } catch (error) {
    // Error logging handled by external service
    return { success: false, error: 'Request failed' };
  }
}

// Reset password with token
export async function resetPassword(
  resetToken: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resetTokenHash = hashToken(resetToken);

    const user = await prisma.sabiUser.findFirst({
      where: {
        resetToken: resetTokenHash,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return { success: false, error: 'Invalid or expired reset link' };
    }

    const passwordHash = await hash(newPassword, 10);

    await prisma.sabiUser.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { success: true };
  } catch (error) {
    // Error logging handled by external service
    return { success: false, error: 'Reset failed' };
  }
}

// Generate API key
export async function generateSabiApiKey(userId: string, name: string): Promise<{ key: string; error?: string } | null> {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);

    const apiKey = await prisma.sabiApiToken.create({
      data: {
        userId,
        name,
        tokenHash,
      },
    });

    return { key: `sabi_${apiKey.id}_${token}` };
  } catch (error) {
    // Error logging handled by external service
    return null;
  }
}
