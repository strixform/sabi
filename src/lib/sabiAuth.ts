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

// ─── Stateless signed session tokens ───────────────────────────────────────
// SECURITY: the session token must cryptographically bind to the userId so it
// cannot be forged or swapped. Token = `${userId}.${exp}.${HMAC(userId.exp)}`.
// The userId is taken FROM the verified token (not a separate cookie), which
// closes the previous "set sabi_session_id to anyone" auth-bypass. Stateless,
// so it needs no DB column (the Turso sessionToken write is best-effort).
function getSessionSecret(): string {
  const s = process.env.SABI_SESSION_SECRET || process.env.SABI_INTEGRATION_TOKEN || process.env.SABI_ADMIN_SECRET || '';
  if (!s) console.error('[sabiAuth] No session secret env set — sessions are insecure. Set SABI_SESSION_SECRET.');
  return s;
}
// Legacy signature (no version) — kept so existing 3-part tokens still verify as v0.
function signSessionLegacy(userId: string, exp: string | number): string {
  return crypto.createHmac('sha256', getSessionSecret()).update(`${userId}.${exp}`).digest('base64url');
}
// Versioned signature — the session version is bumped on password change so old tokens die.
function signSession(userId: string, exp: string | number, ver: number): string {
  return crypto.createHmac('sha256', getSessionSecret()).update(`${userId}.${exp}.${ver}`).digest('base64url');
}
function makeSessionToken(userId: string, ver: number): string {
  const exp = Date.now() + SESSION_DURATION;
  return `${userId}.${exp}.${ver}.${signSession(userId, exp, ver)}`;
}
/** Returns { userId, ver } iff the token's signature + expiry are valid, else null.
 *  Accepts legacy 3-part tokens (treated as version 0) for a smooth rollout. */
function verifySessionToken(token: string): { userId: string; ver: number } | null {
  const secret = getSessionSecret();
  if (!secret) return null; // fail closed when misconfigured
  const parts = token.split('.');
  const ok = (sig: string, expected: string) => {
    const a = Buffer.from(sig), b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  };
  if (parts.length === 4) {
    const [userId, expStr, verStr, sig] = parts;
    if (!userId || !expStr || !verStr || !sig) return null;
    if (!/^\d+$/.test(expStr) || Number(expStr) < Date.now()) return null;
    if (!/^\d+$/.test(verStr)) return null;
    if (!ok(sig, signSession(userId, expStr, Number(verStr)))) return null;
    return { userId, ver: Number(verStr) };
  }
  if (parts.length === 3) {
    const [userId, expStr, sig] = parts;
    if (!userId || !expStr || !sig) return null;
    if (!/^\d+$/.test(expStr) || Number(expStr) < Date.now()) return null;
    if (!ok(sig, signSessionLegacy(userId, expStr))) return null;
    return { userId, ver: 0 };
  }
  return null;
}

/** The user's current session version — Redis-cached, DB-backed, fail-open (null). */
async function currentSessionVersion(userId: string): Promise<number | null> {
  try {
    const { getUserSessionVersion, setUserSessionVersion } = await import('./redis');
    const cached = await getUserSessionVersion(userId);
    if (cached != null) return cached;
    const r = await sabiExecute({ sql: `SELECT sessionVersion FROM SabiUser WHERE id = ? LIMIT 1`, args: [userId] }).catch(() => null);
    const ver = r ? Number((r.rows[0] as any)?.sessionVersion || 0) : 0;
    setUserSessionVersion(userId, ver).catch(() => {});
    return ver;
  } catch {
    return null; // can't determine → fail open (don't lock users out)
  }
}

/** Bump the user's session version → invalidates every existing session token. */
export async function bumpSessionVersion(userId: string): Promise<number> {
  try { await sabiExecute({ sql: `ALTER TABLE SabiUser ADD COLUMN sessionVersion INTEGER NOT NULL DEFAULT 0` }); } catch { /* exists */ }
  await sabiExecute({ sql: `UPDATE SabiUser SET sessionVersion = COALESCE(sessionVersion,0) + 1 WHERE id = ?`, args: [userId] }).catch(() => {});
  const r = await sabiExecute({ sql: `SELECT sessionVersion FROM SabiUser WHERE id = ? LIMIT 1`, args: [userId] }).catch(() => null);
  const ver = r ? Number((r.rows[0] as any)?.sessionVersion || 1) : 1;
  const { setUserSessionVersion } = await import('./redis');
  await setUserSessionVersion(userId, ver);
  return ver;
}

// Register user
export async function registerSabiUser(
  email: string,
  password: string,
  name: string,
  businessName?: string,
  referralCode?: string,
  signupIp?: string,
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    // Normalise email — case-insensitive + trimmed — so "Owlet@x.com" and
    // "owlet@x.com" can never become two accounts.
    email = (email || "").trim().toLowerCase();

    // Check if user exists (case-insensitive via the normalised value above).
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

    // Record signup IP (guarded — column may not exist in prod) for fraud checks.
    if (signupIp) {
      await prisma.$executeRaw`UPDATE "SabiUser" SET "signupIp" = ${signupIp} WHERE id = ${user.id}`.catch(() => {});
    }

    // Create referral record (rewards granted on first paid order). Block obvious
    // self-referral: same signup IP as the referrer = almost certainly the same
    // person farming the bonus → don't create the referral link at all.
    if (referrer) {
      let sameIp = false;
      if (signupIp) {
        try {
          const r: any[] = await prisma.$queryRaw`SELECT "signupIp" FROM "SabiUser" WHERE id = ${referrer.id} LIMIT 1`;
          sameIp = !!r?.[0]?.signupIp && r[0].signupIp === signupIp;
        } catch { /* column missing — skip IP check */ }
      }
      if (!sameIp) {
        await prisma.sabiReferral.create({
          data: { referrerId: referrer.id, refereeId: user.id },
        }).catch(() => {});
      }
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
): Promise<{ success: boolean; error?: string; userId?: string; user?: SabiSession }> {
  try {
    // Read via DIRECT libsql (sabiExecute) — NOT Prisma. Prisma's libsql adapter
    // has 10-80s cold starts on Vercel; the 6s withDbTimeout fired before Prisma
    // connected → DB_TIMEOUT → "Server is busy". sabiExecute is raw HTTP (no cold
    // start) with 429 retry backoff. Same fix as the Google callback.
    let user: any = null;
    let lookupErr = '';
    // Retry the lookup on TRANSIENT Turso errors. Under load Turso throws
    // "operation was aborted" (and 429/timeout/busy) — these were previously
    // mislabeled as a generic "Login failed", locking real users out. Retry with
    // backoff and only give up after 3 tries.
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await sabiExecute({
          // LOWER(email) so login is case-insensitive even for legacy rows stored
          // with mixed-case emails (which a plain `email = ?` lowercased arg misses).
          sql: `SELECT id, email, name, passwordHash, status, emailVerified, businessName
                FROM SabiUser WHERE LOWER(email) = ? LIMIT 1`,
          args: [(email || "").trim().toLowerCase()],
        }, 6000);
        user = res.rows[0] ?? null;
        lookupErr = '';
        break;
      } catch (e: any) {
        lookupErr = (e?.message || '').toLowerCase();
        const transient = lookupErr.includes('429') || lookupErr.includes('rate') || lookupErr.includes('timeout')
          || lookupErr.includes('abort') || lookupErr.includes('busy') || lookupErr.includes('fetch') || lookupErr.includes('econn');
        if (!transient || attempt === 3) break;
        await new Promise(r => setTimeout(r, 500 * attempt)); // back off, then retry
      }
    }
    if (lookupErr) {
      // Every attempt hit a transient DB error — tell the user to retry, never
      // imply their password is wrong.
      return { success: false, error: 'Server is busy — please try again in a moment' };
    }

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

    // Return the full profile (already fetched above) so the login route can
    // prewarm Redis WITHOUT a second DB lookup. The old prewarm did a separate
    // prisma.findUnique that timed out on a cold Turso → Redis never warmed →
    // dashboard hit cold Turso again → null session → "refresh & login again".
    return {
      success: true,
      userId: user.id,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        businessName: user.businessName ?? null,
        status: user.status,
        emailVerified: !!user.emailVerified,
      },
    };
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
  // Embed the user's current session version so a later password change invalidates it.
  const ver = (await currentSessionVersion(userId)) ?? 0;
  const token = makeSessionToken(userId, ver); // signed: `${userId}.${exp}.${ver}.${hmac}`
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
    // path '/' is REQUIRED — without it the cookie defaults to the /api/sabi/auth
    // request directory and isn't sent to /sabi/dashboard or other API routes.
    path: '/',
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
    if (!token) return null;

    // 1. SECURITY: verify the token's HMAC signature + expiry. The userId is taken
    //    from inside the signed token — NOT from a separate (forgeable) cookie.
    const v = verifySessionToken(token);
    if (!v) return null;
    const { userId, ver } = v;

    // 1b. SECURITY: the token's version must match the user's current session version.
    //     A password change bumps that version, so every token issued before it dies.
    //     Fail-open (null) only when we genuinely can't determine the version.
    const cur = await currentSessionVersion(userId);
    if (cur != null && ver !== cur) return null;

    // 2. Check Redis cache — avoids DB query on 90%+ of requests. The cache key is
    //    the signed token, which is now unforgeable, so a cache hit is trustworthy.
    const cached = await tryGetCachedSession(token);
    if (cached) return cached as SabiSession;

    // 3. Load the user profile by the VERIFIED userId. Direct libsql (no Prisma
    //    cold-start). Lookup by primary key.
    let user: any = null;
    try {
      const result = await sabiExecute({
        sql: `SELECT id, email, name, businessName, status, emailVerified
              FROM SabiUser
              WHERE id = ? AND status != 'banned'
              LIMIT 1`,
        args: [userId],
      });
      user = result.rows[0] ?? null;
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
  // Must match the path the cookies were set with ('/'), else delete is a no-op.
  cookieStore.delete({ name: 'sabi_session_token', path: '/' });
  cookieStore.delete({ name: 'sabi_session_id', path: '/' });
}

// Request password reset
export async function requestPasswordReset(
  email: string
): Promise<{ success: boolean; error?: string; resetToken?: string; name?: string }> {
  try {
    // Direct libsql with explicit columns — Prisma's full-column SELECT throws when
    // the prod Turso schema lags (doctrine rule #3), which was breaking reset.
    const res = await sabiExecute({
      sql: `SELECT id, name FROM SabiUser WHERE LOWER(email) = ? LIMIT 1`,
      args: [(email || "").trim().toLowerCase()],
    });
    const user = res.rows[0];
    if (!user) {
      return { success: false, error: 'Email not found' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = hashToken(resetToken);
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour (ISO text)

    await sabiExecute({
      sql: `UPDATE SabiUser SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?`,
      args: [resetTokenHash, resetExpiry, user.id],
    });

    return { success: true, resetToken, name: user.name as string };
  } catch (error) {
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
    const nowIso = new Date().toISOString();

    // Direct libsql with explicit columns + retry — resilient to Turso blips and
    // schema lag (the old Prisma full-column query was throwing "Reset failed").
    const res = await sabiExecute({
      sql: `SELECT id FROM SabiUser WHERE resetToken = ? AND resetTokenExpiry > ? LIMIT 1`,
      args: [resetTokenHash, nowIso],
    });
    const user = res.rows[0];
    if (!user) {
      return { success: false, error: 'Invalid or expired reset link' };
    }

    const passwordHash = await hash(newPassword, 10);

    await sabiExecute({
      sql: `UPDATE SabiUser SET passwordHash = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?`,
      args: [passwordHash, user.id as string],
    });

    return { success: true };
  } catch (error) {
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
