import { NextRequest, NextResponse } from 'next/server';
import { verifyFlwWebhookSignature, verifyFlwTransaction } from '@/lib/sabiFlutterwave';
import { creditSabiWallet } from '@/lib/sabiWallet';
import { prisma } from '@/lib/prisma';
export const maxDuration = 15;
export const preferredRegion = 'sfo1'; // Turso DB in Oregon (sfo1) — keeps latency minimal


export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('verif-hash') || '';

    if (!verifyFlwWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let raw: any;
    try { raw = JSON.parse(body); } catch { return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 }); }
    const data = raw?.data || {};

    if (raw?.event !== 'charge.completed') {
      return NextResponse.json({ success: true });
    }

    // Verify by transaction id (falls back to tx_ref) — never trust the raw amount.
    const verification = await verifyFlwTransaction(String(data.id || data.tx_ref || ''));
    if (!verification.success || verification.status !== 'successful') {
      return NextResponse.json({ success: true });
    }

    const txRef = String(data.tx_ref || '');

    // Attribute the payment to a user. Two funding paths share this webhook:
    //   1. Card / checkout top-up → tx_ref is `sabi_<userId>_...`
    //   2. Dedicated (static) virtual account transfer → attribute by the
    //      receiving account number / order_ref stored at creation.
    let userId: string | null = null;
    let creditRef = txRef;
    const checkoutMatch = txRef.match(/^sabi_([a-z0-9]+)_/);
    if (checkoutMatch) {
      userId = checkoutMatch[1];
    } else {
      const { findUserByVirtualAccountPayload } = await import('@/lib/sabiVirtualAccount');
      userId = await findUserByVirtualAccountPayload(data);
      // Idempotency key for VA inflows = the FLW transaction id (unique per transfer).
      creditRef = `va_${data.id || txRef}`;
    }

    if (!userId) {
      // Unrecognised inflow — silently accept (could be another product's webhook).
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Verify user exists
    const user = await prisma.sabiUser.findUnique({
      where: { id: userId },
    });

    if (!user) {
      // Don't expose user not found - could be user enumeration attack
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Use the VERIFIED amount (in naira) rather than the raw webhook value.
    const amountNaira = Number(verification.amount ?? data.amount ?? 0);
    const amountInKobo = Math.round(amountNaira * 100);

    // Validate amount is reasonable (≤ 10M naira) and positive.
    if (amountInKobo <= 0 || amountInKobo > 1000000000) {
      // Silently reject suspicious amounts
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // creditSabiWallet is idempotent on (userId, type='fund', reference) — safe
    // against webhook replays and a racing browser callback.
    const creditResult = await creditSabiWallet(userId, amountInKobo, creditRef);

    if (!creditResult.success) {
      // Generic success response - don't expose internal errors to attacker
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Flat top-up bonus — idempotent via the `_bonus` ref, so it's safe even if
    // the browser callback also ran. Capped by the daily promo budget. Applies to
    // both checkout and dedicated-account funding.
    try {
      const { topupBonusKobo, DAILY_PROMO_BUDGET_KOBO } = await import('@/lib/sabiPerks');
      const bonusKobo = topupBonusKobo(amountInKobo);
      if (bonusKobo > 0) {
        const { consumePromoBudget } = await import('@/lib/redis');
        if (await consumePromoBudget(bonusKobo, DAILY_PROMO_BUDGET_KOBO)) {
          await creditSabiWallet(userId, bonusKobo, `${creditRef}_bonus`);
        }
      }
    } catch { /* bonus is best-effort */ }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log internally but don't expose to client
    // In production, use proper logging service (Sentry, LogRocket, etc)
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
