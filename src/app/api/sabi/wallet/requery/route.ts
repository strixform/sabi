import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { verifyFlwTransaction } from '@/lib/sabiFlutterwave';
import { creditSabiWallet } from '@/lib/sabiWallet';

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
  const refs = [...new Set(refsRaw.map(String))].filter(r => r.startsWith(ownerPrefix)).slice(0, 8);

  if (refs.length === 0) {
    return NextResponse.json({ success: true, found: 0, creditedNaira: 0, message: 'No recent funding reference found on this device to re-check.' });
  }

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

  return NextResponse.json({
    success: true,
    found: succeeded,
    newBalanceNaira: newBalanceKobo != null ? Math.round(newBalanceKobo / 100) : null,
    message: succeeded > 0
      ? `Re-checked ${refs.length} payment(s). Your wallet is now up to date${newBalanceKobo != null ? ` — balance ₦${Math.round(newBalanceKobo / 100).toLocaleString()}` : ''}.`
      : 'No successful payment found to credit yet. If you were debited, wait a minute and try again — or contact support with your receipt.',
  });
}
