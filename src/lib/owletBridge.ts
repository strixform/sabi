import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

/**
 * Owlet → SABI single sign-on (the verifying half).
 *
 * Owlet signs a short-lived assertion about who its user is. We verify it,
 * then find-or-create the matching SabiUser and let the caller open a normal
 * SABI session. Identity only — the two apps keep separate wallets and
 * separate Flutterwave accounts, so nothing here moves money.
 */

export interface HandoffClaims {
  owletUserId: string;
  email: string;
  name: string;
  emailVerified: boolean;
  nonce: string;
  exp: number;
}

export type VerifyResult =
  | { ok: true; claims: HandoffClaims }
  | { ok: false; reason: string };

export function bridgeConfigured(): boolean {
  return Boolean(process.env.OWLET_SABI_SECRET);
}

/** Verify signature and expiry. Does NOT touch the database. */
export function verifyHandoffToken(token: string): VerifyResult {
  const secret = process.env.OWLET_SABI_SECRET;
  if (!secret) return { ok: false, reason: 'not_configured' };

  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, reason: 'malformed' };
  const [payload, signature] = parts;

  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');

  // Constant-time compare so a wrong signature can't be narrowed by timing.
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: 'bad_signature' };
  }

  let claims: HandoffClaims;
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return { ok: false, reason: 'bad_payload' };
  }

  if (!claims.owletUserId || !claims.email) return { ok: false, reason: 'incomplete' };
  if (typeof claims.exp !== 'number' || claims.exp * 1000 < Date.now()) {
    return { ok: false, reason: 'expired' };
  }

  return { ok: true, claims };
}

export type ResolveResult =
  | { ok: true; userId: string; created: boolean }
  | { ok: false; reason: 'needs_verification' };

/**
 * Find-or-create the SabiUser behind an Owlet identity.
 *
 * The security decision lives here. Linking an EXISTING SabiUser by email is
 * an account-takeover path: someone could register that address on Owlet,
 * never prove they own it, and be handed a funded SABI account. So an existing
 * account is only ever linked when Owlet has verified the address. Creating a
 * brand-new account is safe either way — there is nothing yet to steal.
 */
export async function resolveOwletUser(claims: HandoffClaims): Promise<ResolveResult> {
  const email = claims.email.trim().toLowerCase();

  // Already linked from a previous hand-off — nothing to decide.
  const linked = await prisma.sabiUser.findFirst({
    where: { owletUserId: claims.owletUserId },
    select: { id: true },
  });
  if (linked) return { ok: true, userId: linked.id, created: false };

  const existing = await prisma.sabiUser.findUnique({
    where: { email },
    select: { id: true, owletUserId: true },
  });

  if (existing) {
    if (!claims.emailVerified) return { ok: false, reason: 'needs_verification' };
    await prisma.sabiUser.update({
      where: { id: existing.id },
      data: { owletUserId: claims.owletUserId },
    });
    return { ok: true, userId: existing.id, created: false };
  }

  // New account. passwordHash stays null — this user signs in through Owlet,
  // exactly like the existing Google path. Wallet starts empty and is funded
  // through SABI's own Flutterwave, never from the Owlet wallet.
  const created = await prisma.sabiUser.create({
    data: {
      email,
      name: claims.name || email.split('@')[0],
      passwordHash: null,
      emailVerified: claims.emailVerified,
      owletUserId: claims.owletUserId,
      wallet: { create: {} },
    },
    select: { id: true },
  });

  return { ok: true, userId: created.id, created: true };
}
