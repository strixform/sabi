import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { verifyFlwTransaction } from '@/lib/sabiFlutterwave';
import { creditSabiWallet } from '@/lib/sabiWallet';
import { sabiExecute } from '@/lib/tursoClient';

export const maxDuration = 20;
export const preferredRegion = 'sfo1';

/**
 * Self-service funding re-check. When a webhook is delayed and a successful
 * payment hasn't reflected, the buyer can re-check it themselves instead of
 * messaging support. We verify their recent tx_ref(s) directly with Flutterwave
 * and credit any that succeeded — creditSabiWallet is idempotent, so a payment
 * already credited by the webhook/callback is safely skipped (never double-paid).
 *
 * POST { txRefs: string[] }  (the refs the client saved when it started funding)
 */
export async function POST(req: NextRequest) {
  const session = await getSabiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const refsRaw: string[] = Array.isArray(body.txRefs) ? body.txRefs : (body.txRef ? [body.txRef] : []);
  // Only this user's refs (format: sabi_{userId[:8]}_…) — never let someone claim another's.
  const ownerPrefix = `sabi_${session.id.substring(0, 8)}_`;

  // Server-side pending refs: robust even when the buyer's device didn't save the
  // ref (paid by bank transfer from another phone, cleared browser, etc.).
  let serverRefs: string[] = [];
  try {
    const r = await sabiExecute({
      sql: `SELECT reference FROM SabiTransaction WHERE userId = ? AND type = 'fund_pending' AND reference IS NOT NULL AND createdAt > datetime('now','-4 days') ORDER BY createdAt DESC LIMIT 15`,
      args: [session.id],
    });
    serverRefs = r.rows.map((row: any) => String(row.reference)).filter(Boolean);
  } catch { /* fall back to client refs */ }

  const refs = [...new Set([...refsRaw.map(String), ...serverRefs])].filter(r => r.startsWith(ownerPrefix)).slice(0, 15);

  let newBalanceKobo: number | null = null;
  let creditedKobo = 0;
  let succeeded = 0;

  for (const ref of refs) {
    try {
      const v = await verifyFlwTransaction(ref);
      if (!v.success || v.status !== 'successful') continue;
      // Defensive double-check the verified ref still belongs to this user.
      if (v.txRef && !v.txRef.startsWith(ownerPrefix)) continue;
      const kobo = Math.round((v.amount || 0) * 100);
      if (kobo <= 0) continue;
      succeeded++;
      const r = await creditSabiWallet(session.id, kobo, v.txRef || ref);
      if (r.success) {
        if (typeof r.balance === 'number') newBalanceKobo = r.balance;
        // creditSabiWallet is idempotent; a duplicate ref returns success without
        // re-crediting. We can't perfectly tell new vs duplicate here, so we report
        // the resulting balance and let the UI show the user their true balance.
        creditedKobo += kobo;
      }
    } catch { /* skip this ref, try the rest */ }
  }

  // ROBUST SWEEP — the ref-based path above only works if we KNOW the ref (a saved
  // pending row or the client's localStorage). A buyer who paid on another device,
  // cleared their cache, or whose pending row never got written has NO ref — yet
  // they hold a real receipt. So we also ask Flutterwave directly for this user's
  // successful transactions by email and credit any of THEIR OWN card top-ups
  // (tx_ref sabi_{userId8}_…) the webhook missed. Idempotent per tx_ref, so a
  // payment already credited is safely skipped. This is what makes the re-check
  // actually find a paid-but-not-reflected top-up without the user hunting a ref.
  try {
    const { listFlwTransactionsByEmail } = await import('@/lib/sabiFlutterwave');
    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const txs = await listFlwTransactionsByEmail(session.email, from).catch(() => [] as any[]);
    const emailLc = (session.email || '').toLowerCase();
    const done = new Set(refs);
    for (const tx of txs) {
      if (tx?.status !== 'successful') continue;
      if ((tx?.currency || 'NGN') !== 'NGN') continue;
      const ref = String(tx?.tx_ref || '');
      // Two independent guards: it's THIS user's own card ref, AND Flutterwave
      // attributes the transaction to their email — so no one can pull another's.
      if (!ref.startsWith(ownerPrefix)) continue;
      if (String(tx?.customer?.email || '').toLowerCase() !== emailLc) continue;
      if (done.has(ref)) continue; done.add(ref);
      const kobo = Math.round(Number(tx?.amount || 0) * 100);
      if (kobo <= 0) continue;
      succeeded++;
      const r = await creditSabiWallet(session.id, kobo, ref);
      if (r.success) {
        if (typeof r.balance === 'number') newBalanceKobo = r.balance;
        creditedKobo += kobo;
      }
    }
  } catch { /* best-effort — the ref-based path still applied above */ }

  if (succeeded === 0 && refs.length === 0) {
    return NextResponse.json({ success: true, found: 0, creditedNaira: 0, message: 'No successful payment found on your account yet. If you were debited, wait a minute and re-check — or contact support with your receipt.' });
  }

  return NextResponse.json({
    success: true,
    found: succeeded,
    newBalanceNaira: newBalanceKobo != null ? Math.round(newBalanceKobo / 100) : null,
    message: succeeded > 0
      ? `Re-checked ${refs.length} payment(s). Your wallet is now up to date${newBalanceKobo != null ? ` — balance ₦${Math.round(newBalanceKobo / 100).toLocaleString()}` : ''}.`
      : 'No successful payment found to credit yet. If you were debited, wait a minute and try again — or contact support with your receipt.',
  });
}
