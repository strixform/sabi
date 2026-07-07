/**
 * SABI dedicated (static) virtual accounts.
 *
 * Optional, opt-in top-up method that lives ALONGSIDE the existing Flutterwave
 * checkout — it never replaces it. A user who enters their NIN once gets a
 * permanent bank account number they can transfer to from any bank app; the
 * money lands via the wallet webhook and credits their SabiWallet.
 *
 * Privacy: we send the NIN to Flutterwave to mint the account but only ever
 * PERSIST the last 4 digits (for the user to recognise it) — never the full NIN.
 */
import crypto from 'crypto';
import { sabiExecute } from './tursoClient';
import { createStaticVirtualAccount } from './sabiFlutterwave';

// Guarded, lazy DDL — mirrors the rest of SABI (raw libsql, create-if-missing).
let vaReady = false;
async function ensureVaTable(): Promise<void> {
  if (vaReady) return;
  await sabiExecute({
    sql: `CREATE TABLE IF NOT EXISTS SabiVirtualAccount (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL UNIQUE,
      accountNumber TEXT,
      bankName TEXT,
      accountName TEXT,
      orderRef TEXT,
      flwRef TEXT,
      ninLast4 TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  }).catch(() => {});
  // Indexes power webhook attribution (match an inflow → the owning user).
  await sabiExecute({ sql: `CREATE INDEX IF NOT EXISTS idx_sva_account ON SabiVirtualAccount(accountNumber)` }).catch(() => {});
  await sabiExecute({ sql: `CREATE INDEX IF NOT EXISTS idx_sva_order ON SabiVirtualAccount(orderRef)` }).catch(() => {});
  vaReady = true;
}

export interface VirtualAccount {
  accountNumber: string;
  bankName: string;
  accountName: string | null;
  status: string;
  createdAt: string;
}

/** NIN is exactly 11 digits. */
export function isValidNin(nin: string): boolean {
  return /^\d{11}$/.test((nin || '').trim());
}

export async function getUserVirtualAccount(userId: string): Promise<VirtualAccount | null> {
  await ensureVaTable();
  const r = await sabiExecute({
    sql: `SELECT accountNumber, bankName, accountName, status, createdAt
          FROM SabiVirtualAccount WHERE userId = ? LIMIT 1`,
    args: [userId],
  }).catch(() => null);
  const row = r?.rows[0] as any;
  if (!row || !row.accountNumber) return null;
  return {
    accountNumber: String(row.accountNumber),
    bankName: String(row.bankName || ''),
    accountName: row.accountName ?? null,
    status: String(row.status || 'active'),
    createdAt: String(row.createdAt || ''),
  };
}

/**
 * Create (once) a dedicated account for a user. Idempotent — if they already
 * have one we return it rather than minting a second.
 */
export async function createUserVirtualAccount(
  userId: string,
  opts: { nin: string; email: string; name: string; phone?: string }
): Promise<{ success: boolean; account?: VirtualAccount; error?: string }> {
  await ensureVaTable();
  const nin = (opts.nin || '').trim();
  if (!isValidNin(nin)) return { success: false, error: 'Enter a valid 11-digit NIN' };

  const existing = await getUserVirtualAccount(userId);
  if (existing) return { success: true, account: existing };

  const parts = (opts.name || 'SABI User').trim().split(/\s+/);
  const firstname = parts[0] || 'SABI';
  const lastname = parts.slice(1).join(' ') || firstname;
  const txRef = `sabiva_${userId.substring(0, 8)}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

  const res = await createStaticVirtualAccount({
    email: opts.email,
    nin,
    txRef,
    firstname,
    lastname,
    phonenumber: opts.phone,
    narration: `${opts.name || 'SABI User'} — SABI`,
  });
  if (!res.success || !res.data) {
    return { success: false, error: res.error || 'Could not create your dedicated account' };
  }

  const d = res.data;
  await sabiExecute({
    sql: `INSERT OR REPLACE INTO SabiVirtualAccount
            (id, userId, accountNumber, bankName, accountName, orderRef, flwRef, ninLast4, status, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))`,
    args: [
      crypto.randomUUID(), userId, d.accountNumber, d.bankName || null,
      d.accountName || null, d.orderRef || null, d.flwRef || null, nin.slice(-4),
    ],
  }).catch(() => {});

  return {
    success: true,
    account: {
      accountNumber: d.accountNumber,
      bankName: d.bankName || '',
      accountName: d.accountName || null,
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  };
}

/**
 * Webhook attribution: given the `data` object of a charge.completed event that
 * is NOT one of our checkout tx_refs, find which user's dedicated account
 * received the transfer. Matches by the receiving account number (most reliable)
 * then falls back to the order_ref/flw_ref stored at creation.
 */
export async function findUserByVirtualAccountPayload(data: any): Promise<string | null> {
  await ensureVaTable();

  // The account that RECEIVED the money can surface in a few payload shapes.
  const accountNumbers = [
    data?.account_number,
    data?.meta?.account_number,
    data?.entity?.account_number,
  ]
    .filter((v: any) => typeof v === 'string' || typeof v === 'number')
    .map((v: any) => String(v));

  for (const acc of accountNumbers) {
    const r = await sabiExecute({
      sql: `SELECT userId FROM SabiVirtualAccount WHERE accountNumber = ? LIMIT 1`,
      args: [acc],
    }).catch(() => null);
    const uid = (r?.rows[0] as any)?.userId;
    if (uid) return String(uid);
  }

  const refs = [data?.tx_ref, data?.order_ref, data?.flw_ref].filter((v: any) => typeof v === 'string');
  for (const ref of refs) {
    const r = await sabiExecute({
      sql: `SELECT userId FROM SabiVirtualAccount WHERE orderRef = ? LIMIT 1`,
      args: [ref],
    }).catch(() => null);
    const uid = (r?.rows[0] as any)?.userId;
    if (uid) return String(uid);
  }

  return null;
}
