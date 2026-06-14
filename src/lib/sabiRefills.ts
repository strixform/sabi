import { randomUUID } from 'crypto';
import { sabiExecute } from './tursoClient';

/**
 * Refill / drop-protection requests.
 *
 * A buyer can request a refill on a delivered order (e.g. some followers
 * dropped). The request is ADMIN-MODERATED — an admin verifies the drop is real
 * (not someone gaming free engagement) before approving. On approval a free
 * top-up order is created for the requested quantity and pushed to gamers360.
 *
 * Self-creating table — no manual Turso migration needed.
 */

export interface RefillRequest {
  id: string;
  orderId: string;
  userId: string;
  serviceType: string;
  targetUrl: string;
  refillQuantity: number;
  reason: string | null;
  status: string;            // pending | approved | rejected
  adminNote: string | null;
  refillOrderId: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await sabiExecute({
    sql: `CREATE TABLE IF NOT EXISTS SabiRefillRequest (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      userId TEXT NOT NULL,
      serviceType TEXT NOT NULL,
      targetUrl TEXT NOT NULL,
      refillQuantity INTEGER NOT NULL,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      adminNote TEXT,
      refillOrderId TEXT,
      createdAt TEXT NOT NULL,
      resolvedAt TEXT
    )`,
    args: [],
  });
  try { await sabiExecute({ sql: `CREATE INDEX IF NOT EXISTS idx_refill_status ON SabiRefillRequest (status, createdAt)`, args: [] }); } catch {}
  try { await sabiExecute({ sql: `CREATE INDEX IF NOT EXISTS idx_refill_order ON SabiRefillRequest (orderId)`, args: [] }); } catch {}
  tableReady = true;
}

export async function createRefillRequest(input: {
  orderId: string; userId: string; serviceType: string; targetUrl: string; refillQuantity: number; reason?: string;
}): Promise<{ ok: boolean; error?: string; request?: RefillRequest }> {
  await ensureTable();
  // Block duplicate pending requests for the same order.
  const existing = await sabiExecute({
    sql: `SELECT id FROM SabiRefillRequest WHERE orderId = ? AND status = 'pending' LIMIT 1`,
    args: [input.orderId],
  });
  if (existing.rows.length > 0) return { ok: false, error: 'A refill request for this order is already pending review.' };

  const id = randomUUID();
  const createdAt = new Date().toISOString();
  await sabiExecute({
    sql: `INSERT INTO SabiRefillRequest (id, orderId, userId, serviceType, targetUrl, refillQuantity, reason, status, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    args: [id, input.orderId, input.userId, input.serviceType, input.targetUrl, input.refillQuantity, input.reason ?? null, createdAt],
  });
  return { ok: true, request: { id, ...input, reason: input.reason ?? null, status: 'pending', adminNote: null, refillOrderId: null, createdAt, resolvedAt: null } };
}

export async function getRefillForOrder(orderId: string): Promise<RefillRequest | null> {
  await ensureTable();
  const r = await sabiExecute({ sql: `SELECT * FROM SabiRefillRequest WHERE orderId = ? ORDER BY createdAt DESC LIMIT 1`, args: [orderId] });
  return (r.rows[0] as any) ?? null;
}

export async function listRefills(status?: string): Promise<RefillRequest[]> {
  await ensureTable();
  const r = status
    ? await sabiExecute({ sql: `SELECT * FROM SabiRefillRequest WHERE status = ? ORDER BY createdAt DESC LIMIT 200`, args: [status] })
    : await sabiExecute({ sql: `SELECT * FROM SabiRefillRequest ORDER BY createdAt DESC LIMIT 200`, args: [] });
  return (r.rows as any) ?? [];
}

export async function getRefill(id: string): Promise<RefillRequest | null> {
  await ensureTable();
  const r = await sabiExecute({ sql: `SELECT * FROM SabiRefillRequest WHERE id = ? LIMIT 1`, args: [id] });
  return (r.rows[0] as any) ?? null;
}

export async function resolveRefill(id: string, status: 'approved' | 'rejected', adminNote?: string, refillOrderId?: string): Promise<void> {
  await ensureTable();
  await sabiExecute({
    sql: `UPDATE SabiRefillRequest SET status = ?, adminNote = ?, refillOrderId = ?, resolvedAt = ? WHERE id = ?`,
    args: [status, adminNote ?? null, refillOrderId ?? null, new Date().toISOString(), id],
  });
}
