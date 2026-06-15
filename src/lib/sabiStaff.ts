import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { sabiExecute } from './tursoClient';
import { getSabiSession } from './sabiAuth';
import { checkSabiAdmin } from './sabiAdminAuth';

/**
 * SABI staff (moderators). Staff are existing SabiUsers whose email is on the
 * staff allowlist. They can moderate Orders, delivery proofs and Requests, but
 * NOT touch money/settings/users (those routes use checkSabiAdmin = owner only,
 * so staff are rejected there automatically).
 *
 * Self-creating tables — no migration:
 *   SabiStaff        — the allowlist (email + active flag)
 *   SabiStaffAudit   — every staff action (who/what/when) for accountability
 *   SabiProofReview  — per-order proof coherence verdict (verified/flagged + note)
 */

export type AdminRole = 'owner' | 'staff' | null;

let ready = false;
async function ensure() {
  if (ready) return;
  await sabiExecute({ sql: `CREATE TABLE IF NOT EXISTS SabiStaff (
      email TEXT PRIMARY KEY,
      addedBy TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )` });
  await sabiExecute({ sql: `CREATE TABLE IF NOT EXISTS SabiStaffAudit (
      id TEXT PRIMARY KEY,
      staffEmail TEXT NOT NULL,
      action TEXT NOT NULL,
      target TEXT,
      detail TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )` });
  await sabiExecute({ sql: `CREATE TABLE IF NOT EXISTS SabiProofReview (
      orderId TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      note TEXT,
      reviewedBy TEXT NOT NULL,
      reviewedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )` });
  ready = true;
}

// ─── Staff allowlist ───────────────────────────────────────────────────────
export async function listStaff(): Promise<{ email: string; addedBy: string | null; active: boolean; createdAt: string }[]> {
  await ensure();
  const r = await sabiExecute({ sql: `SELECT email, addedBy, active, createdAt FROM SabiStaff ORDER BY createdAt DESC` });
  return r.rows.map((x: any) => ({ email: x.email, addedBy: x.addedBy ?? null, active: Number(x.active) === 1, createdAt: x.createdAt }));
}

export async function addStaff(email: string, addedBy: string): Promise<void> {
  await ensure();
  const e = email.trim().toLowerCase();
  await sabiExecute({
    sql: `INSERT INTO SabiStaff (email, addedBy, active) VALUES (?, ?, 1)
          ON CONFLICT(email) DO UPDATE SET active = 1, addedBy = excluded.addedBy`,
    args: [e, addedBy],
  });
}

export async function removeStaff(email: string): Promise<void> {
  await ensure();
  await sabiExecute({ sql: `UPDATE SabiStaff SET active = 0 WHERE email = ?`, args: [email.trim().toLowerCase()] });
}

export async function isActiveStaff(email: string): Promise<boolean> {
  if (!email) return false;
  await ensure();
  const r = await sabiExecute({ sql: `SELECT 1 FROM SabiStaff WHERE email = ? AND active = 1 LIMIT 1`, args: [email.trim().toLowerCase()] });
  return r.rows.length > 0;
}

// ─── Role resolution ───────────────────────────────────────────────────────
/** Resolve who is calling: owner (full), staff (scoped), or null (reject). */
export async function getAdminRole(req: NextRequest): Promise<{ role: AdminRole; email: string | null }> {
  // Owner: matches the owner email or the shared admin token.
  if (await checkSabiAdmin(req)) {
    let email: string | null = null;
    try { email = (await getSabiSession())?.email?.toLowerCase() ?? 'owner'; } catch { email = 'owner'; }
    return { role: 'owner', email };
  }
  // Staff: a signed-in SabiUser whose email is on the active allowlist.
  try {
    const session = await getSabiSession();
    const email = session?.email?.toLowerCase();
    if (email && (await isActiveStaff(email))) return { role: 'staff', email };
  } catch { /* ignore */ }
  return { role: null, email: null };
}

/** True for owner OR active staff — use on routes staff are allowed to use. */
export async function allowOwnerOrStaff(req: NextRequest): Promise<{ ok: boolean; role: AdminRole; email: string | null }> {
  const { role, email } = await getAdminRole(req);
  return { ok: role !== null, role, email };
}

// ─── Audit ─────────────────────────────────────────────────────────────────
export async function logStaffAction(staffEmail: string, action: string, target?: string, detail?: string): Promise<void> {
  try {
    await ensure();
    await sabiExecute({
      sql: `INSERT INTO SabiStaffAudit (id, staffEmail, action, target, detail) VALUES (?, ?, ?, ?, ?)`,
      args: [crypto.randomUUID(), staffEmail || 'unknown', action, target ?? null, detail ?? null],
    });
  } catch { /* never let audit failure break the action */ }
}

export async function listAudit(limit = 100): Promise<any[]> {
  await ensure();
  const r = await sabiExecute({ sql: `SELECT staffEmail, action, target, detail, createdAt FROM SabiStaffAudit ORDER BY createdAt DESC LIMIT ?`, args: [limit] });
  return r.rows;
}

// ─── Proof-coherence reviews ─────────────────────────────────────────────────
export async function setProofReview(orderId: string, status: 'verified' | 'flagged', note: string, reviewedBy: string): Promise<void> {
  await ensure();
  await sabiExecute({
    sql: `INSERT INTO SabiProofReview (orderId, status, note, reviewedBy, reviewedAt) VALUES (?, ?, ?, ?, datetime('now'))
          ON CONFLICT(orderId) DO UPDATE SET status = excluded.status, note = excluded.note, reviewedBy = excluded.reviewedBy, reviewedAt = datetime('now')`,
    args: [orderId, status, note || '', reviewedBy],
  });
}

/** All currently-flagged proofs, enriched with order info, for the owner's review. */
export async function listFlaggedReviews(limit = 100): Promise<any[]> {
  await ensure();
  try {
    const r = await sabiExecute({
      sql: `SELECT pr.orderId, pr.note, pr.reviewedBy, pr.reviewedAt,
                   o.serviceType, o.targetUrl, o.status AS orderStatus, o.quantity, o.completedQuantity
              FROM SabiProofReview pr
              LEFT JOIN SabiOrder o ON o.id = pr.orderId
             WHERE pr.status = 'flagged'
             ORDER BY pr.reviewedAt DESC LIMIT ?`,
      args: [limit],
    });
    return r.rows;
  } catch {
    // Fallback without the join if SabiOrder shape differs.
    const r = await sabiExecute({ sql: `SELECT orderId, note, reviewedBy, reviewedAt FROM SabiProofReview WHERE status = 'flagged' ORDER BY reviewedAt DESC LIMIT ?`, args: [limit] });
    return r.rows;
  }
}

/** Review verdicts for a set of orders, keyed by orderId. */
export async function getProofReviews(orderIds: string[]): Promise<Record<string, { status: string; note: string | null; reviewedBy: string; reviewedAt: string }>> {
  const out: Record<string, any> = {};
  const ids = Array.from(new Set(orderIds.filter(Boolean)));
  if (ids.length === 0) return out;
  await ensure();
  const placeholders = ids.map(() => '?').join(',');
  const r = await sabiExecute({ sql: `SELECT orderId, status, note, reviewedBy, reviewedAt FROM SabiProofReview WHERE orderId IN (${placeholders})`, args: ids });
  for (const row of r.rows as any[]) out[row.orderId] = { status: row.status, note: row.note ?? null, reviewedBy: row.reviewedBy, reviewedAt: row.reviewedAt };
  return out;
}
