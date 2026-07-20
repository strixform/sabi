/**
 * Owlet → SABI welcome promo. Owlet has 1M+ verified emails. If someone registers
 * on SABI with an email that's on the Owlet list, they get a one-time ₦2,000 SABI
 * wallet credit to spend on services. SABI has no cashout, so this credit is
 * inherently spend-only (never withdrawable).
 *
 * The email list is a pointer/allowlist only (OwletEmail) — we don't "register" the
 * Owlet users; we just check membership and grant once. Gated by OWLET_PROMO=on.
 */
import { sabiExecute } from './tursoClient';
import { creditSabiWallet } from './sabiWallet';
import { prisma } from './prisma';

export const OWLET_BONUS_KOBO = 200_000; // ₦2,000

let ready = false;
async function ensure() {
  if (ready) return;
  await sabiExecute({
    sql: `CREATE TABLE IF NOT EXISTS OwletEmail (
      email TEXT PRIMARY KEY,
      claimed INTEGER NOT NULL DEFAULT 0,
      claimedByUserId TEXT,
      claimedAt TEXT,
      addedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  }).catch(() => {});
  ready = true;
}

/** Bulk-add Owlet emails to the allowlist (idempotent). Send in chunks of ~5–10k. */
export async function importOwletEmails(emails: string[]): Promise<{ added: number; seen: number }> {
  await ensure();
  const clean = Array.from(new Set(emails.map(e => String(e || '').trim().toLowerCase()).filter(e => e.includes('@') && e.length <= 200)));
  let added = 0;
  const CH = 500;
  for (let i = 0; i < clean.length; i += CH) {
    const batch = clean.slice(i, i + CH);
    const ph = batch.map(() => '(?)').join(',');
    const r = await sabiExecute({ sql: `INSERT OR IGNORE INTO OwletEmail (email) VALUES ${ph}`, args: batch }).catch(() => ({ rowsAffected: 0 }));
    added += Number((r as any).rowsAffected || 0);
  }
  return { added, seen: clean.length };
}

/**
 * Grant the one-time ₦2,000 if this email is on the Owlet list and hasn't claimed.
 * Atomic claim so it can never be granted twice. Returns granted kobo (0 if not eligible).
 */
/** Hard cap on total claims (treasury guard). Raise OWLET_PROMO_MAX_CLAIMS as you gain
 *  confidence — at ₦2,000 each, 10,000 claims = ₦20M. Promo auto-stops once hit. */
function maxClaims(): number { return Math.max(0, parseInt(process.env.OWLET_PROMO_MAX_CLAIMS || '10000', 10) || 0); }

export async function grantOwletBonus(userId: string, email: string): Promise<{ granted: number }> {
  // ON by default (kill-switch OWLET_PROMO=off). Harmless until the allowlist is
  // imported — with an empty list nobody matches, so no grants happen. Importing the
  // emails is the real trigger; the claim cap below bounds total exposure.
  if (process.env.OWLET_PROMO === 'off') return { granted: 0 };
  const e = String(email || '').trim().toLowerCase();
  if (!e) return { granted: 0 };
  await ensure();
  // Treasury guard — stop granting once the total-claims cap is reached.
  const claimedR = await sabiExecute({ sql: `SELECT COUNT(*) AS n FROM OwletEmail WHERE claimed = 1` }).catch(() => ({ rows: [{ n: 0 }] as any[] }));
  if (Number((claimedR.rows[0] as any)?.n || 0) >= maxClaims()) return { granted: 0 };
  // Atomically claim — succeeds once, only for an email that's on the list and unclaimed.
  const claim = await sabiExecute({
    sql: `UPDATE OwletEmail SET claimed = 1, claimedByUserId = ?, claimedAt = datetime('now') WHERE email = ? AND claimed = 0`,
    args: [userId, e],
  }).catch(() => ({ rowsAffected: 0 }));
  if (Number((claim as any).rowsAffected || 0) !== 1) return { granted: 0 }; // not on list, or already claimed

  const r = await creditSabiWallet(userId, OWLET_BONUS_KOBO, `owlet_promo_${userId}`);
  if (!r.success) {
    // Credit failed — release the claim so a retry can grant it later.
    await sabiExecute({ sql: `UPDATE OwletEmail SET claimed = 0, claimedByUserId = NULL, claimedAt = NULL WHERE email = ?`, args: [e] }).catch(() => {});
    return { granted: 0 };
  }
  return { granted: OWLET_BONUS_KOBO };
}

/**
 * Diagnose why a specific email did/didn't get the ₦2,000 — the exact reason a
 * user "registered with the same email but didn't get it". Admin support tool.
 */
export async function diagnoseOwletEmail(rawEmail: string) {
  await ensure();
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!email) return { email, onList: false, userExists: false };
  const row = await sabiExecute({ sql: `SELECT claimed, claimedByUserId, claimedAt FROM OwletEmail WHERE email = ?`, args: [email] }).catch(() => ({ rows: [] as any[] }));
  const onList = row.rows.length > 0;
  const claimed = onList && Number((row.rows[0] as any).claimed) === 1;
  const user = await prisma.sabiUser.findFirst({ where: { email }, select: { id: true, name: true, emailVerified: true } }).catch(() => null);
  let alreadyCredited = false;
  if (user) {
    const dup = await sabiExecute({ sql: `SELECT id FROM SabiTransaction WHERE userId = ? AND type = 'fund' AND reference = ? LIMIT 1`, args: [user.id, `owlet_promo_${user.id}`] }).catch(() => ({ rows: [] as any[] }));
    alreadyCredited = dup.rows.length > 0;
  }
  const stats = await owletStats();
  const capReached = stats.claimed >= stats.maxClaims;
  const eligibleToGrant = !!(onList && !claimed && user && user.emailVerified && !capReached && stats.enabled && !alreadyCredited);
  // Human-readable reason it hasn't landed.
  let reason = 'Eligible — grant it.';
  if (alreadyCredited) reason = 'Already credited ₦2,000 (check their wallet/transactions).';
  else if (!stats.enabled) reason = 'Promo is switched OFF (OWLET_PROMO=off).';
  else if (!onList) reason = 'This email is NOT on the Owlet allowlist (maybe a different email, or not imported).';
  else if (!user) reason = 'No SABI account exists with this email yet.';
  else if (!user.emailVerified) reason = 'SABI email not verified — they must verify to claim (the grant fires on verify).';
  else if (claimed) reason = 'Already claimed on the allowlist' + (row.rows[0] && (row.rows[0] as any).claimedByUserId ? ` (by user ${(row.rows[0] as any).claimedByUserId})` : '') + '.';
  else if (capReached) reason = 'Promo claim cap reached — no more grants.';
  return {
    email, onList, claimed, claimedByUserId: onList ? (row.rows[0] as any).claimedByUserId : null, claimedAt: onList ? (row.rows[0] as any).claimedAt : null,
    userExists: !!user, userId: user?.id || null, userName: user?.name || null, emailVerified: !!user?.emailVerified,
    alreadyCredited, capReached, promoEnabled: stats.enabled, eligibleToGrant, reason,
  };
}

/**
 * Retroactive sweep: grant the ₦2,000 to every VERIFIED SABI user whose email is on
 * the allowlist and hasn't claimed — fixes everyone who verified before the promo/
 * import went live. Idempotent + cap-bounded (grantOwletBonus guards both). Paginated
 * by user id so repeated calls cover the whole base without re-crediting anyone.
 */
export async function sweepRetroactiveGrants(limit = 300, cursor?: string): Promise<{ granted: number; scanned: number; nextCursor: string | null; grantedEmails: string[] }> {
  await ensure();
  if (process.env.OWLET_PROMO === 'off') return { granted: 0, scanned: 0, nextCursor: null, grantedEmails: [] };
  const take = Math.max(1, Math.min(500, limit));
  const users = await prisma.sabiUser.findMany({
    where: { emailVerified: true, ...(cursor ? { id: { gt: cursor } } : {}) },
    select: { id: true, email: true },
    orderBy: { id: 'asc' }, take,
  }).catch(() => [] as { id: string; email: string }[]);
  let granted = 0; const grantedEmails: string[] = [];
  for (const u of users) {
    const g = await grantOwletBonus(u.id, u.email).catch(() => ({ granted: 0 }));
    if (g.granted > 0) { granted++; if (grantedEmails.length < 50) grantedEmails.push(u.email); }
  }
  const nextCursor = users.length === take ? users[users.length - 1].id : null;
  return { granted, scanned: users.length, nextCursor, grantedEmails };
}

export async function owletStats(): Promise<{ total: number; claimed: number; enabled: boolean; maxClaims: number }> {
  await ensure();
  const t = await sabiExecute({ sql: `SELECT COUNT(*) AS n FROM OwletEmail` }).catch(() => ({ rows: [{ n: 0 }] as any[] }));
  const c = await sabiExecute({ sql: `SELECT COUNT(*) AS n FROM OwletEmail WHERE claimed = 1` }).catch(() => ({ rows: [{ n: 0 }] as any[] }));
  return { total: Number((t.rows[0] as any)?.n || 0), claimed: Number((c.rows[0] as any)?.n || 0), enabled: process.env.OWLET_PROMO !== 'off', maxClaims: maxClaims() };
}
