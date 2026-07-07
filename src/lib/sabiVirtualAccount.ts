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
  // Guarded add — the table may already exist from an earlier deploy without this
  // column. createTxRef = the tx_ref we sent at creation; some FLW inflow payloads
  // echo it, giving another attribution key.
  await sabiExecute({ sql: `ALTER TABLE SabiVirtualAccount ADD COLUMN createTxRef TEXT` }).catch(() => {});
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
            (id, userId, accountNumber, bankName, accountName, orderRef, flwRef, createTxRef, ninLast4, status, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))`,
    args: [
      crypto.randomUUID(), userId, d.accountNumber, d.bankName || null,
      d.accountName || null, d.orderRef || null, d.flwRef || null, txRef, nin.slice(-4),
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

  // Deep-scan the whole payload: collect every leaf value so attribution doesn't
  // depend on Flutterwave putting the account number / reference at a path we
  // guessed. Numeric-looking leaves (6–12 digits) are candidate account numbers;
  // string leaves are candidate references.
  const numeric = new Set<string>();
  const strings = new Set<string>();
  const walk = (o: any, depth: number) => {
    if (o == null || depth > 6) return;
    if (Array.isArray(o)) { o.forEach((v) => walk(v, depth + 1)); return; }
    if (typeof o === 'object') { for (const k in o) walk(o[k], depth + 1); return; }
    const s = String(o).trim();
    if (!s) return;
    if (/^\d{6,12}$/.test(s)) numeric.add(s);
    if (s.length <= 80) strings.add(s);
  };
  walk(data, 0);

  const vals = Array.from(new Set([...numeric, ...strings]));
  if (vals.length === 0) return null;

  // One indexed query: match any leaf against a stored account number or any of
  // the references we captured at creation.
  const ph = vals.map(() => '?').join(',');
  const r = await sabiExecute({
    sql: `SELECT userId FROM SabiVirtualAccount
          WHERE accountNumber IN (${ph})
             OR orderRef   IN (${ph})
             OR flwRef     IN (${ph})
             OR createTxRef IN (${ph})
          LIMIT 1`,
    args: [...vals, ...vals, ...vals, ...vals],
  }).catch(() => null);
  const uid = (r?.rows[0] as any)?.userId;
  return uid ? String(uid) : null;
}

/**
 * Pull-based recovery: ask Flutterwave for this user's successful transactions and
 * credit any dedicated-account transfer the webhook missed. Idempotent (ref
 * `va_<id>`), and it skips checkout/creation refs so it can never double-credit a
 * card top-up.
 */
export async function reconcileVirtualAccount(
  userId: string,
  email: string
): Promise<{ credited: number; amountKobo: number; seen: number }> {
  await ensureVaTable();
  const va = await getUserVirtualAccount(userId);
  if (!va) return { credited: 0, amountKobo: 0, seen: 0 };

  const { listFlwTransactionsByEmail, listFlwRecentSuccessful } = await import('./sabiFlutterwave');
  const { creditSabiWallet } = await import('./sabiWallet');

  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Two strategies, de-duplicated by FLW transaction id:
  //  (a) transactions filed under the user's email;
  //  (b) recent successful transactions whose payload contains THIS user's
  //      dedicated account number (covers FLW filing the inflow under a different
  //      customer email than ours).
  const [byEmail, broad] = await Promise.all([
    listFlwTransactionsByEmail(email, from),
    listFlwRecentSuccessful(from),
  ]);
  const byId = new Map<string, any>();
  for (const tx of [...byEmail, ...broad]) {
    if (tx?.id != null) byId.set(String(tx.id), tx);
  }
  const txs = Array.from(byId.values());

  const emailLc = (email || '').toLowerCase();
  const deepContains = (o: any, needle: string, depth = 0): boolean => {
    if (o == null || depth > 6) return false;
    if (Array.isArray(o)) return o.some((v) => deepContains(v, needle, depth + 1));
    if (typeof o === 'object') return Object.values(o).some((v) => deepContains(v, needle, depth + 1));
    return String(o).trim() === needle;
  };

  let credited = 0;
  let amountKobo = 0;
  for (const tx of txs) {
    if (tx?.status !== 'successful') continue;
    if ((tx?.currency || 'NGN') !== 'NGN') continue;
    const amt = Number(tx?.amount || 0);
    if (!(amt > 0)) continue;
    const ref = String(tx?.tx_ref || '');
    // Skip card/checkout top-ups (already credited under their own ref) and our
    // own creation echo — only genuine VA inflows remain.
    if (ref.startsWith('sabi_') || ref.startsWith('sabiva_')) continue;

    // The transaction must belong to THIS user: either FLW attributes it to their
    // email, or their dedicated account number appears somewhere in the payload.
    const belongs =
      String(tx?.customer?.email || '').toLowerCase() === emailLc ||
      deepContains(tx, va.accountNumber);
    if (!belongs) continue;

    const creditRef = `va_${tx.id}`;
    // Only count credits that are actually NEW (creditSabiWallet returns success on
    // duplicates too).
    const dup = await sabiExecute({
      sql: `SELECT id FROM SabiTransaction WHERE userId = ? AND type = 'fund' AND reference = ? LIMIT 1`,
      args: [userId, creditRef],
    }).catch(() => null);
    if (dup && dup.rows.length > 0) continue;

    const kobo = Math.round(amt * 100);
    const r = await creditSabiWallet(userId, kobo, creditRef);
    if (r.success) {
      credited += 1;
      amountKobo += kobo;
      // Same idempotent top-up bonus the webhook applies, so a recovered transfer
      // isn't shortchanged.
      try {
        const { topupBonusKobo, DAILY_PROMO_BUDGET_KOBO } = await import('./sabiPerks');
        const bonusKobo = topupBonusKobo(kobo);
        if (bonusKobo > 0) {
          const { consumePromoBudget } = await import('./redis');
          if (await consumePromoBudget(bonusKobo, DAILY_PROMO_BUDGET_KOBO)) {
            await creditSabiWallet(userId, bonusKobo, `${creditRef}_bonus`);
          }
        }
      } catch { /* bonus is best-effort */ }
    }
  }
  return { credited, amountKobo, seen: txs.length };
}
