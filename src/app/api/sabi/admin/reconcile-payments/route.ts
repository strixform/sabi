/**
 * SABI Admin — Flutterwave payment reconciliation
 * POST /api/sabi/admin/reconcile-payments
 *
 * The admin uploads a Flutterwave transaction export (successful payments). For each
 * row we (a) map it to a SABI user via the tx_ref (`sabi_{userId[:8]}_...`), (b) check
 * whether the wallet was already credited (a 'fund' SabiTransaction with that reference),
 * and (c) if not — and `commit` is true — verify the transaction against Flutterwave's
 * live API and credit the wallet with the FLUTTERWAVE-VERIFIED amount.
 *
 * SAFETY INVARIANTS
 *  - We NEVER credit the amount from the uploaded CSV. On commit we re-verify every
 *    missing transaction against Flutterwave and credit only the amount Flutterwave
 *    returns. The CSV amount is shown in the preview only, clearly as "claimed".
 *  - Idempotency: crediting keys on (userId, type='fund', reference=tx_ref), the exact
 *    same key the live payment callback uses. Re-running is always safe — an already
 *    credited payment reports 'already_complete' and is skipped.
 *
 * Body: { rows: Row[], commit?: boolean }
 *   Row = { txRef?, flwId?, amount?, status?, email? }
 * Returns: { success, summary, results }
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkSabiAdmin } from '@/lib/sabiAdminAuth';
import { sabiExecute } from '@/lib/tursoClient';
import { verifyFlwTransaction } from '@/lib/sabiFlutterwave';
import { creditSabiWallet } from '@/lib/sabiWallet';

export const preferredRegion = 'sfo1';
export const maxDuration = 60;

const MAX_ROWS = 300; // per request — re-run for larger files (idempotent)
const TXREF_RE = /^sabi_([a-zA-Z0-9]{8})_/;

type Row = { txRef?: string; flwId?: string; amount?: number; status?: string; email?: string };
type Outcome =
  | 'already_complete' | 'missing' | 'completed'
  | 'user_not_found' | 'ambiguous' | 'not_successful'
  | 'verify_failed' | 'credit_failed' | 'no_reference';

interface Result {
  txRef: string | null;
  flwId: string | null;
  email: string | null;
  userId: string | null;
  userEmail: string | null;
  outcome: Outcome;
  claimedNaira: number | null;   // from CSV (unverified)
  creditedKobo: number | null;   // FLW-verified amount actually credited
  newBalanceKobo: number | null;
  note?: string;
}

async function resolveUser(row: Row): Promise<{ userId: string; userEmail: string } | { error: 'user_not_found' | 'ambiguous' }> {
  // 1. Primary: tx_ref carries the first 8 chars of the userId.
  const m = row.txRef ? TXREF_RE.exec(row.txRef.trim()) : null;
  if (m) {
    const prefix = m[1];
    const u = await sabiExecute({
      sql: `SELECT id, email FROM SabiUser WHERE id LIKE ? LIMIT 5`,
      args: [`${prefix}%`],
    });
    if (u.rows.length === 1) {
      return { userId: String((u.rows[0] as any).id), userEmail: String((u.rows[0] as any).email) };
    }
    if (u.rows.length > 1) {
      // Disambiguate an 8-char prefix collision using the CSV customer email.
      if (row.email) {
        const hit = (u.rows as any[]).find(r => String(r.email).toLowerCase() === row.email!.trim().toLowerCase());
        if (hit) return { userId: String(hit.id), userEmail: String(hit.email) };
      }
      return { error: 'ambiguous' };
    }
  }
  // 2. Fallback: match by customer email.
  if (row.email) {
    const u = await sabiExecute({
      sql: `SELECT id, email FROM SabiUser WHERE lower(email) = lower(?) LIMIT 2`,
      args: [row.email.trim()],
    });
    if (u.rows.length === 1) {
      return { userId: String((u.rows[0] as any).id), userEmail: String((u.rows[0] as any).email) };
    }
    if (u.rows.length > 1) return { error: 'ambiguous' };
  }
  return { error: 'user_not_found' };
}

export async function POST(req: NextRequest) {
  if (!await checkSabiAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { rows?: Row[]; commit?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const commit = !!body.commit;
  const rows = Array.isArray(body.rows) ? body.rows.slice(0, MAX_ROWS) : [];
  if (rows.length === 0) return NextResponse.json({ error: 'No rows provided' }, { status: 400 });

  const results: Result[] = [];

  for (const row of rows) {
    const txRef = row.txRef?.trim() || null;
    const flwId = row.flwId ? String(row.flwId).trim() : null;
    const email = row.email?.trim() || null;
    const claimedNaira = typeof row.amount === 'number' && row.amount > 0 ? row.amount : null;

    const base: Result = {
      txRef, flwId, email, userId: null, userEmail: null,
      outcome: 'missing', claimedNaira, creditedKobo: null, newBalanceKobo: null,
    };

    // Skip rows the export marks as not successful (defensive — admin should upload successes only).
    if (row.status && !/^success/i.test(row.status.trim())) {
      results.push({ ...base, outcome: 'not_successful' });
      continue;
    }

    // We need a reference to key idempotency. Prefer the merchant tx_ref (what the live
    // callback stores). If only an flwId is present we'll recover the tx_ref via verify.
    if (!txRef && !flwId) {
      results.push({ ...base, outcome: 'no_reference' });
      continue;
    }

    // Resolve the owning user.
    const resolved = await resolveUser(row);
    if ('error' in resolved) {
      results.push({ ...base, outcome: resolved.error });
      continue;
    }
    base.userId = resolved.userId;
    base.userEmail = resolved.userEmail;

    // Canonical idempotency reference = the tx_ref the live flow stores.
    let reference = txRef;
    if (!reference) {
      // No tx_ref in the file — must verify to recover it before we can dedupe safely.
      const v = await verifyFlwTransaction(flwId!);
      if (!v.success || v.status !== 'successful' || !v.txRef) {
        results.push({ ...base, outcome: 'verify_failed', note: v.error || 'could not recover tx_ref' });
        continue;
      }
      reference = v.txRef;
      base.txRef = v.txRef;
    }

    // Already credited?
    const dup = await sabiExecute({
      sql: `SELECT id FROM SabiTransaction WHERE userId = ? AND type = 'fund' AND reference = ? LIMIT 1`,
      args: [resolved.userId, reference],
    });
    if (dup.rows.length > 0) {
      results.push({ ...base, outcome: 'already_complete' });
      continue;
    }

    // Missing. In scan mode, stop here and report.
    if (!commit) {
      results.push({ ...base, outcome: 'missing' });
      continue;
    }

    // Commit: verify against Flutterwave (authoritative) and credit the VERIFIED amount.
    const v = await verifyFlwTransaction(flwId || reference);
    if (!v.success || v.status !== 'successful') {
      results.push({ ...base, outcome: 'verify_failed', note: v.error || `status=${v.status ?? 'unknown'}` });
      continue;
    }
    // Defence: the verified tx_ref must still belong to this user.
    const vm = v.txRef ? TXREF_RE.exec(v.txRef) : null;
    if (vm && !resolved.userId.startsWith(vm[1])) {
      results.push({ ...base, outcome: 'verify_failed', note: 'tx_ref ownership mismatch' });
      continue;
    }
    const amountKobo = Math.round((v.amount || 0) * 100);
    if (amountKobo <= 0) {
      results.push({ ...base, outcome: 'verify_failed', note: 'verified amount was zero' });
      continue;
    }

    const credit = await creditSabiWallet(resolved.userId, amountKobo, v.txRef || reference);
    if (!credit.success) {
      results.push({ ...base, outcome: 'credit_failed', note: credit.error });
      continue;
    }
    results.push({
      ...base,
      outcome: 'completed',
      creditedKobo: amountKobo,
      newBalanceKobo: typeof credit.balance === 'number' ? credit.balance : null,
    });
  }

  const summary = {
    total: results.length,
    alreadyComplete: results.filter(r => r.outcome === 'already_complete').length,
    missing: results.filter(r => r.outcome === 'missing').length,
    completed: results.filter(r => r.outcome === 'completed').length,
    userNotFound: results.filter(r => r.outcome === 'user_not_found').length,
    ambiguous: results.filter(r => r.outcome === 'ambiguous').length,
    notSuccessful: results.filter(r => r.outcome === 'not_successful').length,
    verifyFailed: results.filter(r => r.outcome === 'verify_failed').length,
    creditFailed: results.filter(r => r.outcome === 'credit_failed').length,
    noReference: results.filter(r => r.outcome === 'no_reference').length,
    creditedKobo: results.reduce((s, r) => s + (r.creditedKobo || 0), 0),
    capped: rows.length >= MAX_ROWS,
  };

  return NextResponse.json({ success: true, commit, summary, results });
}
