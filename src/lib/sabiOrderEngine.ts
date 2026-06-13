import { prisma } from './prisma';
import { getService, validateOrder } from './sabiServices';
import { computePricing } from './servicesCatalog';
import { debitSabiWallet, refundSabiWallet } from './sabiWallet';

export interface CreateOrderInput {
  userId: string;
  serviceId: string;
  targetUrl: string;
  quantity: number;
  paymentMethod: 'flutterwave' | 'wallet';
  customRef?: string;
  clientId?: string;
  // Audience targeting + comment customization (optional)
  audienceGender?: 'male' | 'female' | 'both';
  audienceLocation?: string;
  commentGender?: 'male' | 'female' | 'both';
  commentInstructions?: string | null;
  promoCodeId?: string;
  discountAmount?: number;
  scheduledAt?: Date;
  startScreenshotUrl?: string; // buyer's "before" screenshot of the target page
  silent?: boolean;            // suppress the placement email (used for drip-feed chunks 2..N)
}

export interface OrderResponse {
  success: boolean;
  orderId?: string;
  totalPrice?: number;
  platformFee?: number;
  basePrice?: number;
  estimatedCompletion?: string;
  gamesz360CampaignId?: string;
  scheduled?: boolean;
  error?: string;
}

function mapServiceToTaskType(serviceId: string): string {
  const service = getService(serviceId);
  return service?.taskType || 'general_engagement';
}

export async function createSabiOrder(input: CreateOrderInput): Promise<OrderResponse> {
  try {
    // Check platform-wide minimum quantity from SABIAdminConfig (set by admin).
    // This overrides the per-service catalog minimum when it's higher.
    // e.g. admin sets minOrderQuantity=50 → orders < 50 are rejected regardless of service.
    try {
      const configRow = await prisma.sABIAdminConfig.findFirst({
        select: { minOrderQuantity: true, maxOrderQuantity: true },
      });
      if (configRow) {
        if (input.quantity < configRow.minOrderQuantity) {
          return { success: false, error: `Minimum order quantity is ${configRow.minOrderQuantity}` };
        }
        if (input.quantity > configRow.maxOrderQuantity) {
          return { success: false, error: `Maximum order quantity is ${configRow.maxOrderQuantity}` };
        }
      }
    } catch { /* Config table missing — fall through to service-level validation */ }

    const validation = validateOrder(input.serviceId, input.quantity, input.targetUrl);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const service = getService(input.serviceId);
    if (!service) {
      return { success: false, error: 'Service not found' };
    }

    const pricing = computePricing(service.pricePerUnit, input.quantity);
    const totalPrice = pricing.totalKobo;           // grand total before promo/welcome (volume discount applied)
    const basePrice = pricing.baseKobo;             // discounted base
    const platformFee = pricing.platformFeeKobo + pricing.vatKobo;

    const user = await prisma.sabiUser.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // ── Discounts applied to the wallet charge ──────────────────────────────
    // Promo discount (from a code the user applied) — capped at the total.
    const promoDiscountKobo = Math.max(0, Math.min(Math.round(input.discountAmount || 0), totalPrice));
    // First-order welcome coupon: 10% off (max ₦2,000), only when no promo is
    // used and this is the user's very first order. Acquisition incentive.
    let welcomeDiscountKobo = 0;
    if (!promoDiscountKobo) {
      const priorOrders = await prisma.sabiOrder.count({ where: { userId: input.userId } });
      if (priorOrders === 0) {
        welcomeDiscountKobo = Math.min(Math.round(pricing.baseKobo * 0.10), 200000);
      }
    }
    const totalDiscountKobo = Math.min(promoDiscountKobo + welcomeDiscountKobo, totalPrice);
    const chargeKobo = totalPrice - totalDiscountKobo;

    const debitResult = await debitSabiWallet(input.userId, chargeKobo, '');
    if (!debitResult.success) {
      return {
        success: false,
        error: debitResult.error || 'Insufficient balance',
      };
    }

    const order = await prisma.sabiOrder.create({
      data: {
        userId: input.userId,
        serviceType: input.serviceId,
        targetUrl: input.targetUrl,
        quantity: input.quantity,
        pricePerUnit: service.pricePerUnit,
        totalPrice: basePrice,
        platformFee: platformFee,
        paymentMethod: input.paymentMethod,
        orderedVia: 'web',
        clientId: input.clientId,
        customRef: input.customRef,
        audienceGender: input.audienceGender || null,
        audienceLocation: input.audienceLocation || null,
        commentGender: input.commentGender || null,
        commentInstructions: input.commentInstructions || null,
        promoCodeId: input.promoCodeId || null,
        discountAmount: totalDiscountKobo,
        scheduledAt: input.scheduledAt || null,
        // Always start as 'pending' — the cron job (process-scheduled) picks
        // it up and submits to gamerz360 asynchronously. This prevents timeouts
        // caused by Cloudflare blocking Vercel's IPs on synchronous calls.
        status: 'pending',
      },
    });

    // Save the buyer's "before" screenshot separately (guarded) — the column may
    // not exist in prod yet, and this must never break order creation.
    if (input.startScreenshotUrl) {
      prisma.$executeRaw`UPDATE "SabiOrder" SET "startScreenshotUrl" = ${input.startScreenshotUrl} WHERE id = ${order.id}`.catch(() => {});
    }

    // Auto top-up check — if wallet fell below threshold, email user a payment link (fire-and-forget)
    prisma.sabiWallet.findUnique({ where: { userId: input.userId }, select: { balance: true, autoTopupEnabled: true, autoTopupThreshold: true, autoTopupAmount: true } })
      .then(async (wallet) => {
        if (!wallet?.autoTopupEnabled || !wallet.autoTopupThreshold || !wallet.autoTopupAmount) return;
        if (wallet.balance >= wallet.autoTopupThreshold) return;
        const user = await prisma.sabiUser.findUnique({ where: { id: input.userId }, select: { email: true, name: true } });
        if (!user) return;
        const amountNaira = Math.round(wallet.autoTopupAmount / 100);
        const { sendAutoTopupEmail } = await import('./email').catch(() => ({ sendAutoTopupEmail: null }));
        if (sendAutoTopupEmail) sendAutoTopupEmail(user.email, user.name, amountNaira);
      }).catch(() => {});

    // Mark promo code used (fire-and-forget)
    if (input.promoCodeId && input.discountAmount) {
      prisma.sabiPromoCode.update({ where: { id: input.promoCodeId }, data: { usedCount: { increment: 1 } } }).catch(() => {});
      prisma.sabiPromoUsage.create({ data: { promoId: input.promoCodeId, userId: input.userId, orderId: order.id, savedKobo: input.discountAmount } }).catch(() => {});
    }

    // Trigger referral reward on first paid order (fire-and-forget).
    // Reward is ₦100 (10000 kobo). The referrer earns from at most
    // REFERRAL_CAP referees — beyond that the referrer stops earning, but
    // each new referee still gets their ₦100 welcome bonus.
    prisma.sabiReferral.findFirst({ where: { refereeId: input.userId, triggeredAt: null } }).then(async ref => {
      if (!ref) return;
      await prisma.sabiReferral.update({ where: { id: ref.id }, data: { triggeredAt: new Date() } });

      const REWARD_KOBO = 10000;   // ₦100
      const REWARD_NAIRA = 100;
      const REFERRAL_CAP = 3;      // referrer earns from max 3 referrals

      // How many referrals has this referrer already been paid for?
      const paidCount = await prisma.sabiReferral.count({
        where: { referrerId: ref.referrerId, referrerPaid: true },
      });
      const referrerEligible = paidCount < REFERRAL_CAP;

      const [referrer, referee] = await Promise.all([
        prisma.sabiUser.findUnique({ where: { id: ref.referrerId }, select: { email: true, name: true } }),
        prisma.sabiUser.findUnique({ where: { id: ref.refereeId }, select: { email: true, name: true } }),
      ]);

      const ops: any[] = [
        // Referee always gets their welcome bonus.
        prisma.sabiWallet.update({ where: { userId: ref.refereeId }, data: { balance: { increment: REWARD_KOBO }, totalFunded: { increment: REWARD_KOBO } } }),
        prisma.sabiReferral.update({ where: { id: ref.id }, data: { refereePaid: true, referrerPaid: referrerEligible } }),
      ];
      // Referrer only earns while under the cap.
      if (referrerEligible) {
        ops.push(prisma.sabiWallet.update({ where: { userId: ref.referrerId }, data: { balance: { increment: REWARD_KOBO }, totalFunded: { increment: REWARD_KOBO } } }));
      }
      await Promise.all(ops);

      const { sendReferralRewardEmail } = await import('./email');
      if (referrer && referrerEligible) sendReferralRewardEmail(referrer.email, referrer.name, REWARD_NAIRA, 'referrer');
      if (referee) sendReferralRewardEmail(referee.email, referee.name, REWARD_NAIRA, 'referee');
    }).catch(() => {});

    // ── PLACEMENT EMAIL ─────────────────────────────────────────────────────
    // Fire-and-forget — never block the order response for email delivery.
    // Sets expectations: real people, 5min–24hr, refund guarantee.
    if (!input.silent) {
      import('./email').then(({ sendOrderPlacedEmail }) => {
        sendOrderPlacedEmail(
          user.email, user.name, order.id,
          service.name, input.quantity,
          Math.round(totalPrice / 100), // kobo → naira
        );
      }).catch(() => {});
    }

    // ── ASYNC ORDER SUBMISSION ──────────────────────────────────────────────
    // Instead of calling gamerz360 synchronously (which times out due to
    // Cloudflare blocking Vercel's IPs), we return success immediately.
    // The cron job (/api/sabi/cron/process-scheduled) picks up all 'pending'
    // orders every 5 minutes and submits them to gamerz360. This gives users
    // instant confirmation without any timeout risk.
    return {
      success: true,
      orderId: order.id,
      totalPrice,
      basePrice,
      platformFee,
      estimatedCompletion: service.estimatedDelivery,
    };

  } catch (error) {
    // Error logging handled by external service
    return { success: false, error: 'Order creation failed' };
  }
}

async function createGamesz360Campaign(
  userId: string,
  orderId: string,
  serviceId: string,
  quantity: number,
  budgetInKobo: number,
  targetUrl: string,
  userName: string,
  brandName: string,
  targeting?: {
    audienceGender?: string;
    audienceLocation?: string;
    commentGender?: string;
    commentInstructions?: string | null;
  }
): Promise<{ success: boolean; campaignId?: string; advertiserId?: string; error?: string }> {
  try {
    const user = await prisma.sabiUser.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Call gamerz360 integration endpoint
    const gamerz360ApiUrl = process.env.GAMERZ360_API_URL || 'https://gamerz360.com';
    const integrationToken = process.env.SABI_INTEGRATION_TOKEN;

    if (!integrationToken) {
      // Integration token not configured - this is a deployment issue, not a user error
      return { success: false, error: 'Integration not configured' };
    }

    // Build a human-readable targeting note for taskers
    const t = targeting || {};
    const targetingParts: string[] = [];
    if (t.audienceGender && t.audienceGender !== 'both') targetingParts.push(`Audience: ${t.audienceGender} only`);
    if (t.audienceLocation && t.audienceLocation !== 'All Nigeria') targetingParts.push(`Location: ${t.audienceLocation}`);
    if (t.commentGender && t.commentGender !== 'both') targetingParts.push(`Commenters: ${t.commentGender} only`);
    if (t.commentInstructions) targetingParts.push(`Comment brief: ${t.commentInstructions}`);
    const targetingNote = targetingParts.length ? targetingParts.join(' | ') : undefined;

    const payload = {
      sabiOrderId: orderId,
      serviceType: serviceId,
      targetUrl,
      quantity,
      totalPrice: budgetInKobo,
      sabiUserId: userId,
      sabiUserEmail: user.email,
      targetingNote,
      webhookUrl: `${process.env.SABI_BASE_URL || 'https://sability.io'}/api/webhooks/gamerz360`,
    };

    // 15s timeout — gamerz360 must respond before SABI's function times out
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${gamerz360ApiUrl}/api/admin/sabi/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${integrationToken}`,
        // Use browser-compatible UA — Cloudflare challenges non-browser UAs
        // even when WAF rules skip custom rules. Auth is via Bearer token.
        'User-Agent': 'Mozilla/5.0 (compatible; SABI-Integration/1.0)',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.text();
      // Error logging handled by external service - don't expose response details
      return {
        success: false,
        error: `Failed to create campaign: ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      campaignId: data.campaignId,
      advertiserId: data.advertiserId,
    };
  } catch (error: any) {
    const isTimeout = error?.name === 'AbortError' || error?.message?.includes('abort');
    console.error('[SABI→G360] Campaign creation error:', error?.message || error);
    return {
      success: false,
      error: isTimeout ? 'Campaign creation timed out — please try again' : 'Campaign creation failed',
    };
  }
}

export async function getSabiOrder(orderId: string, userId: string) {
  try {
    return await prisma.sabiOrder.findFirst({
      where: {
        id: orderId,
        userId,
      },
    });
  } catch (error) {
    // Error logging handled by external service
    return null;
  }
}

export async function getSabiOrders(userId: string, limit: number = 50) {
  try {
    return await prisma.sabiOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (error) {
    // Error logging handled by external service
    return [];
  }
}

export async function cancelSabiOrder(
  orderId: string,
  userId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const order = await prisma.sabiOrder.findFirst({
      where: {
        id: orderId,
        userId,
      },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (!['pending', 'processing'].includes(order.status)) {
      return { success: false, error: 'Cannot cancel order in this status' };
    }

    // Refund what was actually charged: base + fee minus any discount applied.
    const totalPrice = order.totalPrice + order.platformFee - (order.discountAmount || 0);
    const refundResult = await refundSabiWallet(userId, totalPrice, orderId, reason);

    if (refundResult.success) {
      await prisma.sabiOrder.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          refundedAmount: totalPrice,
          refundReason: reason,
        },
      });

      return { success: true };
    }

    return { success: false, error: 'Refund failed' };
  } catch (error) {
    // Error logging handled by external service
    return { success: false, error: 'Cancellation failed' };
  }
}

export async function updateSabiOrderStatus(
  orderId: string,
  status: string,
  completionPercentage?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const order = await prisma.sabiOrder.update({
      where: { id: orderId },
      data: {
        status,
        completionPercentage: completionPercentage || undefined,
        completedAt: status === 'completed' ? new Date() : undefined,
      },
      include: { user: { select: { email: true, name: true, notifyEmail: true } } },
    });

    // Fire-and-forget email + push notifications
    const svcName = order.serviceType.replace(/_/g, ' ');
    if (order.user.notifyEmail) {
      const { sendOrderStartedEmail, sendOrderCompletedEmail, sendOrderFailedEmail } = await import('./email');
      if (status === 'executing') sendOrderStartedEmail(order.user.email, order.user.name, orderId, svcName, order.quantity);
      else if (status === 'completed') sendOrderCompletedEmail(order.user.email, order.user.name, orderId, svcName, order.quantity);
      else if (status === 'failed') sendOrderFailedEmail(order.user.email, order.user.name, orderId, svcName);
    }

    // Push notification
    try {
      const { sendPushToUser } = await import('./pushNotifications');
      if (status === 'executing') {
        sendPushToUser(order.userId, { title: '⚡ Order started', body: `Your ${svcName} order is now running.`, url: `https://sability.io/sabi/orders/${orderId}` });
      } else if (status === 'completed') {
        sendPushToUser(order.userId, { title: '✅ Order complete!', body: `Your ${svcName} order has been delivered.`, url: `https://sability.io/sabi/orders/${orderId}` });
      } else if (status === 'failed') {
        sendPushToUser(order.userId, { title: '⚠️ Order update', body: `Your ${svcName} order hit an issue. Wallet has been refunded.`, url: `https://sability.io/sabi/orders/${orderId}` });
      }
    } catch {}

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Update failed' };
  }
}
