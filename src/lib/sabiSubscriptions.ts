import { randomUUID } from 'crypto';
import { sabiExecute } from './tursoClient';

/**
 * Auto-reorder subscriptions.
 *
 * A subscription re-places the same order on a fixed cadence (e.g. every 7 days)
 * so creators get a steady drip of engagement without re-ordering manually.
 *
 * The table is created on demand (CREATE TABLE IF NOT EXISTS) so this ships
 * without a manual Turso migration and is immune to schema lag.
 */

export interface SabiSubscription {
  id: string;
  userId: string;
  serviceId: string;
  targetUrl: string;
  quantity: number;
  intervalDays: number;
  nextRunAt: string;       // ISO timestamp
  active: number;          // 1 / 0
  audienceGender: string | null;
  audienceLocation: string | null;
  commentGender: string | null;
  commentInstructions: string | null;
  lastOrderId: string | null;
  createdAt: string;
  updatedAt: string;
}

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  await sabiExecute({
    sql: `CREATE TABLE IF NOT EXISTS SabiSubscription (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      serviceId TEXT NOT NULL,
      targetUrl TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      intervalDays INTEGER NOT NULL,
      nextRunAt TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      audienceGender TEXT,
      audienceLocation TEXT,
      commentGender TEXT,
      commentInstructions TEXT,
      lastOrderId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`,
    args: [],
  });
  try {
    await sabiExecute({ sql: `CREATE INDEX IF NOT EXISTS idx_sub_due ON SabiSubscription (active, nextRunAt)`, args: [] });
  } catch { /* index optional */ }
  tableReady = true;
}

function addDays(from: Date, days: number): string {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

export interface UpsertSubInput {
  userId: string;
  serviceId: string;
  targetUrl: string;
  quantity: number;
  intervalDays: number;
  audienceGender?: string | null;
  audienceLocation?: string | null;
  commentGender?: string | null;
  commentInstructions?: string | null;
}

/**
 * Create or update a subscription. If one already exists for the same
 * user + service + targetUrl, it's updated in place (re-subscribing just
 * changes the cadence rather than stacking duplicates).
 */
export async function upsertSubscription(input: UpsertSubInput): Promise<SabiSubscription> {
  await ensureTable();
  const now = new Date();
  const nowIso = now.toISOString();
  const nextRunAt = addDays(now, input.intervalDays);

  const existing = await sabiExecute({
    sql: `SELECT id FROM SabiSubscription WHERE userId = ? AND serviceId = ? AND targetUrl = ? LIMIT 1`,
    args: [input.userId, input.serviceId, input.targetUrl],
  });

  if (existing.rows.length > 0) {
    const id = (existing.rows[0] as any).id as string;
    await sabiExecute({
      sql: `UPDATE SabiSubscription SET quantity = ?, intervalDays = ?, nextRunAt = ?, active = 1,
            audienceGender = ?, audienceLocation = ?, commentGender = ?, commentInstructions = ?, updatedAt = ?
            WHERE id = ?`,
      args: [
        input.quantity, input.intervalDays, nextRunAt,
        input.audienceGender ?? null, input.audienceLocation ?? null,
        input.commentGender ?? null, input.commentInstructions ?? null, nowIso, id,
      ],
    });
    return (await getSubscription(id, input.userId))!;
  }

  const id = randomUUID();
  await sabiExecute({
    sql: `INSERT INTO SabiSubscription
      (id, userId, serviceId, targetUrl, quantity, intervalDays, nextRunAt, active,
       audienceGender, audienceLocation, commentGender, commentInstructions, lastOrderId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, NULL, ?, ?)`,
    args: [
      id, input.userId, input.serviceId, input.targetUrl, input.quantity, input.intervalDays, nextRunAt,
      input.audienceGender ?? null, input.audienceLocation ?? null,
      input.commentGender ?? null, input.commentInstructions ?? null, nowIso, nowIso,
    ],
  });
  return (await getSubscription(id, input.userId))!;
}

export async function getSubscription(id: string, userId: string): Promise<SabiSubscription | null> {
  await ensureTable();
  const r = await sabiExecute({ sql: `SELECT * FROM SabiSubscription WHERE id = ? AND userId = ? LIMIT 1`, args: [id, userId] });
  return (r.rows[0] as any) ?? null;
}

export async function listSubscriptions(userId: string): Promise<SabiSubscription[]> {
  await ensureTable();
  const r = await sabiExecute({ sql: `SELECT * FROM SabiSubscription WHERE userId = ? ORDER BY createdAt DESC`, args: [userId] });
  return (r.rows as any) ?? [];
}

export async function setSubscriptionActive(id: string, userId: string, active: boolean): Promise<boolean> {
  await ensureTable();
  const owned = await sabiExecute({ sql: `SELECT id FROM SabiSubscription WHERE id = ? AND userId = ? LIMIT 1`, args: [id, userId] });
  if (owned.rows.length === 0) return false;
  await sabiExecute({
    sql: `UPDATE SabiSubscription SET active = ?, updatedAt = ? WHERE id = ?`,
    args: [active ? 1 : 0, new Date().toISOString(), id],
  });
  return true;
}

/** Subscriptions whose next run is due — used by the cron. */
export async function getDueSubscriptions(now: Date, limit = 10): Promise<SabiSubscription[]> {
  await ensureTable();
  const r = await sabiExecute({
    sql: `SELECT * FROM SabiSubscription WHERE active = 1 AND nextRunAt <= ? ORDER BY nextRunAt ASC LIMIT ?`,
    args: [now.toISOString(), limit],
  });
  return (r.rows as any) ?? [];
}

/** After a successful auto-order, advance the schedule. */
export async function advanceSubscription(id: string, intervalDays: number, lastOrderId: string): Promise<void> {
  await ensureTable();
  const nextRunAt = addDays(new Date(), intervalDays);
  await sabiExecute({
    sql: `UPDATE SabiSubscription SET nextRunAt = ?, lastOrderId = ?, updatedAt = ? WHERE id = ?`,
    args: [nextRunAt, lastOrderId, new Date().toISOString(), id],
  });
}

/** Pause a subscription that failed (e.g. insufficient funds) so it stops retrying every run. */
export async function pauseSubscription(id: string): Promise<void> {
  await ensureTable();
  await sabiExecute({ sql: `UPDATE SabiSubscription SET active = 0, updatedAt = ? WHERE id = ?`, args: [new Date().toISOString(), id] });
}
