import { NextRequest, NextResponse } from 'next/server';
import { verifyCryptomusWebhook, cryptomusIsPaid, cryptomusUserId } from '@/lib/sabiCryptomus';
import { creditSabiWallet } from '@/lib/sabiWallet';
import { prisma } from '@/lib/prisma';
export const maxDuration = 15;
export const preferredRegion = 'sfo1'; // Turso DB in Oregon (sfo1) — keeps latency minimal

/**
 * Cryptomus payment webhook. Verifies the md5 sign, and on a settled status
 * (paid / paid_over) credits the wallet in NGN kobo. Idempotent via the order_id
 * reference, so repeated 'process'→'paid'→'confirm' callbacks credit exactly once.
 * Always returns 200 so Cryptomus doesn't retry-storm.
 */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    const { ok, data } = verifyCryptomusWebhook(raw);
    if (!ok || !data) return NextResponse.json({ success: true }, { status: 200 });

    if (!cryptomusIsPaid(data.status)) {
      // process / confirm_check / fail / cancel — nothing to credit.
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const userId = cryptomusUserId(data);
    const reference = String(data.order_id || '');
    if (!userId || !reference) return NextResponse.json({ success: true }, { status: 200 });

    const user = await prisma.sabiUser.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ success: true }, { status: 200 });

    // Invoice is denominated in NGN, so `amount` is the naira we asked for.
    const amountNaira = Number(data.amount ?? 0);
    const amountInKobo = Math.round(amountNaira * 100);
    if (amountInKobo <= 0 || amountInKobo > 1000000000) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Idempotent on (userId, type='fund', reference).
    const creditResult = await creditSabiWallet(userId, amountInKobo, reference);
    if (!creditResult.success) return NextResponse.json({ success: true }, { status: 200 });

    // Same top-up bonus as the card providers, idempotent via the `_bonus` ref and
    // capped by the shared daily promo budget.
    try {
      const { topupBonusKobo, DAILY_PROMO_BUDGET_KOBO } = await import('@/lib/sabiPerks');
      const bonusKobo = topupBonusKobo(amountInKobo);
      if (bonusKobo > 0) {
        const { consumePromoBudget } = await import('@/lib/redis');
        if (await consumePromoBudget(bonusKobo, DAILY_PROMO_BUDGET_KOBO)) {
          await creditSabiWallet(userId, bonusKobo, `${reference}_bonus`);
        }
      }
    } catch { /* bonus is best-effort */ }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
