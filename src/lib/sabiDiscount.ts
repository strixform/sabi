import { sabiExecute } from '@/lib/tursoClient';

/**
 * Per-account API discount — a % off every order the user places (set by an admin for selected
 * users, e.g. high-volume API resellers). Applied in createSabiOrder alongside promo/loyalty, and
 * still clamped by the margin floor so an order can never sell below cost.
 * Stored as an integer percent (0–90) on SabiUser.apiDiscountPct.
 */
let ready = false;
async function ensure() {
  if (ready) return;
  try { await sabiExecute({ sql: `ALTER TABLE SabiUser ADD COLUMN apiDiscountPct INTEGER DEFAULT 0`, args: [] }); } catch { /* exists */ }
  ready = true;
}

export async function getAccountDiscountPct(userId: string): Promise<number> {
  await ensure();
  try {
    const r = await sabiExecute({ sql: `SELECT apiDiscountPct FROM SabiUser WHERE id = ? LIMIT 1`, args: [userId] });
    const p = Number((r.rows[0] as any)?.apiDiscountPct || 0);
    return Number.isFinite(p) ? Math.max(0, Math.min(90, p)) : 0;
  } catch { return 0; }
}

export async function setAccountDiscountPct(userId: string, pct: number): Promise<{ ok: boolean }> {
  await ensure();
  const clean = Math.max(0, Math.min(90, Math.floor(Number(pct) || 0)));
  try {
    const r = await sabiExecute({ sql: `UPDATE SabiUser SET apiDiscountPct = ? WHERE id = ?`, args: [clean, userId] });
    return { ok: Number((r as any).rowsAffected || 0) > 0 };
  } catch { return { ok: false }; }
}
