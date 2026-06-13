import { randomUUID } from 'crypto';
import { sabiExecute } from './tursoClient';

/**
 * Saved profiles ("My Accounts") — buyers store the social handles/links they
 * order for once, then reorder in two taps. Self-creating table so it ships
 * without a manual Turso migration.
 */

export interface SavedProfile {
  id: string;
  userId: string;
  label: string;
  platform: string | null;
  url: string;
  createdAt: string;
}

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  await sabiExecute({
    sql: `CREATE TABLE IF NOT EXISTS SabiSavedProfile (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      label TEXT NOT NULL,
      platform TEXT,
      url TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )`,
    args: [],
  });
  try { await sabiExecute({ sql: `CREATE INDEX IF NOT EXISTS idx_savedprofile_user ON SabiSavedProfile (userId)`, args: [] }); } catch {}
  tableReady = true;
}

export async function listSavedProfiles(userId: string): Promise<SavedProfile[]> {
  await ensureTable();
  const r = await sabiExecute({ sql: `SELECT * FROM SabiSavedProfile WHERE userId = ? ORDER BY createdAt DESC`, args: [userId] });
  return (r.rows as any) ?? [];
}

export async function addSavedProfile(userId: string, label: string, url: string, platform?: string | null): Promise<SavedProfile> {
  await ensureTable();
  // De-dupe on same user + url — update the label instead of stacking.
  const existing = await sabiExecute({ sql: `SELECT id FROM SabiSavedProfile WHERE userId = ? AND url = ? LIMIT 1`, args: [userId, url] });
  if (existing.rows.length > 0) {
    const id = (existing.rows[0] as any).id as string;
    await sabiExecute({ sql: `UPDATE SabiSavedProfile SET label = ?, platform = ? WHERE id = ?`, args: [label, platform ?? null, id] });
    return { id, userId, label, platform: platform ?? null, url, createdAt: new Date().toISOString() };
  }
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  await sabiExecute({
    sql: `INSERT INTO SabiSavedProfile (id, userId, label, platform, url, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, userId, label, platform ?? null, url, createdAt],
  });
  return { id, userId, label, platform: platform ?? null, url, createdAt };
}

export async function deleteSavedProfile(id: string, userId: string): Promise<boolean> {
  await ensureTable();
  const owned = await sabiExecute({ sql: `SELECT id FROM SabiSavedProfile WHERE id = ? AND userId = ? LIMIT 1`, args: [id, userId] });
  if (owned.rows.length === 0) return false;
  await sabiExecute({ sql: `DELETE FROM SabiSavedProfile WHERE id = ?`, args: [id] });
  return true;
}
