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
export async function grantOwletBonus(userId: string, email: string): Promise<{ granted: number }> {
  if (process.env.OWLET_PROMO !== 'on') return { granted: 0 };
  const e = String(email || '').trim().toLowerCase();
  if (!e) return { granted: 0 };
  await ensure();
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

export async function owletStats(): Promise<{ total: number; claimed: number; enabled: boolean }> {
  await ensure();
  const t = await sabiExecute({ sql: `SELECT COUNT(*) AS n FROM OwletEmail` }).catch(() => ({ rows: [{ n: 0 }] as any[] }));
  const c = await sabiExecute({ sql: `SELECT COUNT(*) AS n FROM OwletEmail WHERE claimed = 1` }).catch(() => ({ rows: [{ n: 0 }] as any[] }));
  return { total: Number((t.rows[0] as any)?.n || 0), claimed: Number((c.rows[0] as any)?.n || 0), enabled: process.env.OWLET_PROMO === 'on' };
}
