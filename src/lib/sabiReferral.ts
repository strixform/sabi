import { prisma } from './prisma';

/**
 * Referral reward — triggered when a referred user FUNDS at least ₦200.
 * Funding (real money in) is the anti-abuse gate, so there's no cap on how many
 * people a referrer can earn from. Both sides get ₦100.
 *
 * Called (fire-and-forget) after a successful wallet credit.
 */
export const REFERRAL_FUNDING_THRESHOLD_KOBO = 20000; // ₦200
const REWARD_KOBO = 10000;  // ₦100
const REWARD_NAIRA = 100;

export async function triggerReferralOnFunding(userId: string): Promise<void> {
  try {
    // Is this user a referee with an untriggered referral?
    const ref = await prisma.sabiReferral.findFirst({ where: { refereeId: userId, triggeredAt: null } });
    if (!ref) return;

    // Has the referee funded at least the threshold?
    const wallet = await prisma.sabiWallet.findUnique({ where: { userId }, select: { totalFunded: true } });
    if (!wallet || (wallet.totalFunded || 0) < REFERRAL_FUNDING_THRESHOLD_KOBO) return;

    // Claim the trigger first to avoid double-payout on concurrent credits.
    await prisma.sabiReferral.update({ where: { id: ref.id }, data: { triggeredAt: new Date() } });

    const [referrer, referee] = await Promise.all([
      prisma.sabiUser.findUnique({ where: { id: ref.referrerId }, select: { email: true, name: true } }),
      prisma.sabiUser.findUnique({ where: { id: ref.refereeId }, select: { email: true, name: true } }),
    ]);

    await Promise.all([
      prisma.sabiWallet.update({ where: { userId: ref.referrerId }, data: { balance: { increment: REWARD_KOBO }, totalFunded: { increment: REWARD_KOBO } } }),
      prisma.sabiWallet.update({ where: { userId: ref.refereeId }, data: { balance: { increment: REWARD_KOBO }, totalFunded: { increment: REWARD_KOBO } } }),
      prisma.sabiReferral.update({ where: { id: ref.id }, data: { referrerPaid: true, refereePaid: true } }),
    ]);

    const { sendReferralRewardEmail } = await import('./email');
    if (referrer) sendReferralRewardEmail(referrer.email, referrer.name, REWARD_NAIRA, 'referrer');
    if (referee) sendReferralRewardEmail(referee.email, referee.name, REWARD_NAIRA, 'referee');
  } catch {
    /* fire-and-forget — never block wallet funding */
  }
}
