import { randomUUID } from 'crypto';
import { sabiExecute } from './tursoClient';

/**
 * Partnership program — a done-for-you reseller package. The partner pays a
 * one-time fee; we build their branded website with the SABI API embedded so
 * they can resell every service under their own brand.
 *
 * Self-creating table — no manual Turso migration.
 */
export const PARTNERSHIP_FEE_KOBO = 10_000_000; // ₦100,000

export interface Partnership {
  id: string;
  userId: string;
  brandName: string;
  domain: string | null;
  contactPhone: string | null;
  notes: string | null;
  status: string;        // building | live | cancelled
  paidKobo: number;
  createdAt: string;
  updatedAt: string;
}

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await sabiExecute({
    sql: `CREATE TABLE IF NOT EXISTS SabiPartnership (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      brandName TEXT NOT NULL,
      domain TEXT,
      contactPhone TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'building',
      paidKobo INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`,
    args: [],
  });
  try { await sabiExecute({ sql: `CREATE INDEX IF NOT EXISTS idx_partnership_status ON SabiPartnership (status, createdAt)`, args: [] }); } catch {}
  tableReady = true;
}

export async function getPartnershipForUser(userId: string): Promise<Partnership | null> {
  await ensureTable();
  const r = await sabiExecute({ sql: `SELECT * FROM SabiPartnership WHERE userId = ? ORDER BY createdAt DESC LIMIT 1`, args: [userId] });
  return (r.rows[0] as any) ?? null;
}

export async function createPartnership(input: {
  userId: string; brandName: string; domain?: string; contactPhone?: string; notes?: string; paidKobo: number;
}): Promise<Partnership> {
  await ensureTable();
  const id = randomUUID();
  const now = new Date().toISOString();
  await sabiExecute({
    sql: `INSERT INTO SabiPartnership (id, userId, brandName, domain, contactPhone, notes, status, paidKobo, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, 'building', ?, ?, ?)`,
    args: [id, input.userId, input.brandName, input.domain ?? null, input.contactPhone ?? null, input.notes ?? null, input.paidKobo, now, now],
  });
  return { id, userId: input.userId, brandName: input.brandName, domain: input.domain ?? null, contactPhone: input.contactPhone ?? null, notes: input.notes ?? null, status: 'building', paidKobo: input.paidKobo, createdAt: now, updatedAt: now };
}

export async function listPartnerships(status?: string): Promise<Partnership[]> {
  await ensureTable();
  const r = status
    ? await sabiExecute({ sql: `SELECT * FROM SabiPartnership WHERE status = ? ORDER BY createdAt DESC LIMIT 200`, args: [status] })
    : await sabiExecute({ sql: `SELECT * FROM SabiPartnership ORDER BY createdAt DESC LIMIT 200`, args: [] });
  return (r.rows as any) ?? [];
}

export async function setPartnershipStatus(id: string, status: string): Promise<void> {
  await ensureTable();
  await sabiExecute({ sql: `UPDATE SabiPartnership SET status = ?, updatedAt = ? WHERE id = ?`, args: [status, new Date().toISOString(), id] });
}
