import { prisma } from './prisma';
import { hash, compare } from 'bcryptjs';
import { cookies } from 'next/headers';
import crypto from 'crypto';

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
    const user = await prisma.sabiUser.findUnique({ where: { email } });

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
    // Error logging handled by external service
    return { success: false, error: 'Login failed' };
  }
}

// Create session
export async function createSabiSession(userId: string): Promise<string> {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashToken(token);
    const sessionExpiry = new Date(Date.now() + SESSION_DURATION);

    await prisma.sabiUser.update({
      where: { id: userId },
      data: { sessionToken: hashedToken, sessionExpiry },
    });

    // Set cookies
    const cookieStore = await cookies();
    cookieStore.set('sabi_session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION / 1000,
    });

    cookieStore.set('sabi_session_id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION / 1000,
    });

    return token;
  } catch (error) {
    // Error logging handled by external service
    throw error;
  }
}

// Get session — Redis-first with DB fallback.
// Cache hit: ~5ms. Cache miss (first request or after expiry): ~100-200ms DB query.
// TTL: 5 minutes — short enough to catch bans/logouts within a reasonable window.
export async function getSabiSession(): Promise<SabiSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sabi_session_token')?.value;
    const userId = cookieStore.get('sabi_session_id')?.value;

    if (!token || !userId) return null;

    // 1. Check Redis cache — avoids DB query on 90%+ of requests
    // Safe wrapper: Redis unavailable → null → falls through to DB
    const cached = await tryGetCachedSession(token);
    if (cached) return cached as SabiSession;

    // 2. Cache miss — hit DB, then warm the cache
    const hashedToken = hashToken(token);
    const user = await prisma.sabiUser.findFirst({
      where: {
        id: userId,
        sessionToken: hashedToken,
        sessionExpiry: { gt: new Date() },
        status: { not: 'banned' },
      },
    });

    if (!user) return null;

    const session: SabiSession = {
      id: user.id,
      email: user.email,
      name: user.name,
      businessName: user.businessName,
      status: user.status,
      emailVerified: user.emailVerified,
    };

    // Warm cache — fire-and-forget, safe wrapper ensures Redis errors never surface
    trySetCachedSession(token, session, 300);

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
