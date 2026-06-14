/**
 * Buyer perks — top-up funding bonuses and loyalty/VIP tiers.
 * Pure functions shared by the wallet callback, order engine, and UI so the
 * numbers always agree. All money in kobo.
 */

// ── Margin floor ────────────────────────────────────────────────────────────
// The order's base price (baseKobo) is what's sent to gamerz360 as the tasker
// budget — i.e. SABI's COST. Stacked discounts (volume + loyalty + first-order
// + promo) must never push the charge below cost + this minimum margin, or we'd
// sell at a loss. The engine clamps the total discount to honour this floor.
export const MIN_ORDER_MARGIN_RATE = 0.05; // keep ≥5% over tasker cost on every order

/** Max discount (kobo) allowed on an order so it still clears cost + min margin. */
export function maxDiscountKobo(totalChargeKobo: number, baseKobo: number): number {
  const floor = Math.ceil(baseKobo * (1 + MIN_ORDER_MARGIN_RATE));
  return Math.max(0, totalChargeKobo - floor);
}

// ── Daily promo budget ──────────────────────────────────────────────────────
// Caps total giveaway spend per day (cashback + top-up bonuses + referrals) so
// a viral day can't bleed the platform. Enforced via a Redis daily counter.
export const DAILY_PROMO_BUDGET_KOBO = 20_000_000; // ₦200,000/day of giveaways

// ── Top-up funding bonus ────────────────────────────────────────────────────
// Fund more in one go, get a bonus credit. Pulls cash forward.
export const TOPUP_BONUS_TIERS: { minKobo: number; rate: number; label: string }[] = [
  { minKobo: 10_000_000, rate: 0.08, label: '+8%' }, // ≥ ₦100,000
  { minKobo: 5_000_000,  rate: 0.05, label: '+5%' }, // ≥ ₦50,000
  { minKobo: 2_000_000,  rate: 0.03, label: '+3%' }, // ≥ ₦20,000
];

export function topupBonusRate(amountKobo: number): number {
  for (const t of TOPUP_BONUS_TIERS) if (amountKobo >= t.minKobo) return t.rate;
  return 0;
}

export function topupBonusKobo(amountKobo: number): number {
  return Math.round(amountKobo * topupBonusRate(amountKobo));
}

// ── Loyalty / VIP tiers ─────────────────────────────────────────────────────
// Lifetime spend unlocks a permanent discount on every order.
export interface LoyaltyTier {
  name: string;
  rate: number;        // order discount
  minSpentKobo: number;
  icon: string;
}

export const LOYALTY_TIERS: LoyaltyTier[] = [
  { name: 'Platinum', rate: 0.10, minSpentKobo: 200_000_000, icon: '💎' }, // ≥ ₦2,000,000
  { name: 'Gold',     rate: 0.06, minSpentKobo: 50_000_000,  icon: '🥇' }, // ≥ ₦500,000
  { name: 'Silver',   rate: 0.03, minSpentKobo: 10_000_000,  icon: '🥈' }, // ≥ ₦100,000
  { name: 'Bronze',   rate: 0.00, minSpentKobo: 0,           icon: '🥉' },
];

export function loyaltyTier(totalSpentKobo: number): { tier: LoyaltyTier; next: LoyaltyTier | null; toNextKobo: number } {
  const tier = LOYALTY_TIERS.find((t) => totalSpentKobo >= t.minSpentKobo) || LOYALTY_TIERS[LOYALTY_TIERS.length - 1];
  const idx = LOYALTY_TIERS.indexOf(tier);
  const next = idx > 0 ? LOYALTY_TIERS[idx - 1] : null; // higher tiers are earlier in the array
  const toNextKobo = next ? Math.max(0, next.minSpentKobo - totalSpentKobo) : 0;
  return { tier, next, toNextKobo };
}
