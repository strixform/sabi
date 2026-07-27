/**
 * ₦500 "welcome taste" for every email-verified signup.
 *
 * SABI has no cashout, so this credit is inherently SPEND-ONLY (worst case is a
 * free service, never free cash). Idempotent via the transaction reference
 * `welcome_bonus_<userId>` — a user can only ever be granted once. Gated on
 * emailVerified (kills fake-account farming) and a treasury cap.
 */

import { prisma } from './prisma';
import { sabiExecute } from './tursoClient';
import { creditSabiWallet } from './sabiWallet';

export const WELCOME_BONUS_KOBO = 50_000; // ₦500

const enabled = () => process.env.WELCOME_BONUS !== 'off';
const maxClaims = () => Number(process.env.WELCOME_BONUS_MAX_CLAIMS || '200000');
const ref = (userId: string) => `welcome_bonus_${userId}`;

async function underCap(): Promise<boolean> {
  try {
    const r = await sabiExecute({ sql: `SELECT COUNT(*) n FROM SabiTransaction WHERE reference LIKE 'welcome_bonus_%'` });
    return Number((r.rows[0] as { n?: number })?.n ?? 0) < maxClaims();
  } catch { return true; } // never block a grant on a counting hiccup
}

/**
 * Grant the welcome bonus to one user. Returns granted kobo (0 if not eligible /
 * already granted / disabled / cap reached). Safe to call repeatedly.
 */
export async function grantWelcomeBonus(userId: string): Promise<{ granted: number }> {
  if (!enabled()) return { granted: 0 };
  const u = await prisma.sabiUser.findUnique({ where: { id: userId }, select: { emailVerified: true } }).catch(() => null);
  if (!u?.emailVerified) return { granted: 0 };
  if (!(await underCap())) return { granted: 0 };
  const r = await creditSabiWallet(userId, WELCOME_BONUS_KOBO, ref(userId)); // idempotent on the reference
  return r?.success ? { granted: WELCOME_BONUS_KOBO } : { granted: 0 };
}

/** Has this user already been granted the welcome bonus? */
export async function alreadyGranted(userId: string): Promise<boolean> {
  try {
    const r = await sabiExecute({ sql: `SELECT id FROM SabiTransaction WHERE userId = ? AND reference = ? LIMIT 1`, args: [userId, ref(userId)] });
    return r.rows.length > 0;
  } catch { return false; }
}
