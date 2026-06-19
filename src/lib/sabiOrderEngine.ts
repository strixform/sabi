import { prisma } from './prisma';
import { getService, validateOrder } from './sabiServices';
import { computeServicePricing } from './servicesCatalog';
import { debitSabiWallet, refundSabiWallet } from './sabiWallet';
import { sabiExecute } from './tursoClient';

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
  durationMinutes?: number;    // live-stream "stop view time" (watch-time) in minutes
  promoCodeId?: string;
  discountAmount?: number;
  scheduledAt?: Date;
  startScreenshotUrl?: string; // buyer's "before" screenshot of the target page
  startCount?: number;         // buyer's count (followers/likes/…) at buying moment — real baseline
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

    // Comment services MUST carry a brief so taskers write exactly what this buyer
    // wants (and never improvise things like "coming from gamerz"). The order form
    // makes it required; enforce server-side too so the API can't be bypassed.
    const COMMENT_ACTIONS = ['Comments', 'Replies', 'Chat Comments'];
    if (COMMENT_ACTIONS.includes(service.action) && !(input.commentInstructions || '').trim()) {
      return { success: false, error: 'Please describe what the comments should say before placing this order.' };
    }

    // Live-stream watch-time → normalise to a valid option (never trust the
    // client's number) so the charge always matches what we deliver.
    let durationMinutes: number | undefined;
    if (service.durationOptions?.length) {
      durationMinutes = service.durationOptions.includes(Number(input.durationMinutes))
        ? Number(input.durationMinutes)
        : (service.baseDurationMins ?? service.durationOptions[0]);
    }
    // flat_duration services bill by watch-time and ship a fixed viewer pack —
    // force the stored quantity to the standard pack regardless of client input.
    const effectiveQuantity = service.priceModel === 'flat_duration'
      ? (service.standardPack ?? service.minQuantity)
      : input.quantity;

    const pricing = computeServicePricing(service, effectiveQuantity, durationMinutes);
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
    // Loyalty/VIP discount — permanent, based on lifetime spend (stacks with promo).
    let loyaltyDiscountKobo = 0;
    try {
      const w = await prisma.sabiWallet.findUnique({ where: { userId: input.userId }, select: { totalSpent: true } });
      const { loyaltyTier } = await import('./sabiPerks');
      const rate = loyaltyTier(w?.totalSpent || 0).tier.rate;
      if (rate > 0) loyaltyDiscountKobo = Math.round(pricing.baseKobo * rate);
    } catch { /* loyalty is best-effort */ }

    // Clamp the combined discount so the order never sells below cost + min
    // margin (baseKobo is the tasker budget = our cost). Protects margin from
    // stacked promos (volume + loyalty + first-order + promo).
    const { maxDiscountKobo } = await import('./sabiPerks');
    const requestedDiscount = promoDiscountKobo + welcomeDiscountKobo + loyaltyDiscountKobo;
    const totalDiscountKobo = Math.min(requestedDiscount, totalPrice, maxDiscountKobo(totalPrice, basePrice));
    const chargeKobo = totalPrice - totalDiscountKobo;

    const debitResult = await debitSabiWallet(input.userId, chargeKobo, '');
    if (!debitResult.success) {
      return {
        success: false,
        error: debitResult.error || 'Insufficient balance',
      };
    }

    // CRITICAL: the wallet was already debited above. If the order row fails to
    // create, we MUST refund — otherwise the buyer is charged with no order
    // (the "spent but 0 orders" money-safety bug).
    let order;
    try {
      order = await prisma.sabiOrder.create({
        data: {
          userId: input.userId,
          serviceType: input.serviceId,
          targetUrl: input.targetUrl,
          quantity: effectiveQuantity,
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
          // For live-stream orders, fold the chosen watch-time into the instructions
          // so taskers/fulfilment know how long to hold viewers (no schema change).
          commentInstructions: [
            durationMinutes ? `Watch time: ${durationMinutes} min` : '',
            input.commentInstructions || '',
          ].filter(Boolean).join(' | ') || null,
          promoCodeId: input.promoCodeId || null,
          discountAmount: totalDiscountKobo,
          scheduledAt: input.scheduledAt || null,
          // Always start as 'pending' — the cron job (process-scheduled) picks
          // it up and submits to gamerz360 asynchronously. This prevents timeouts
          // caused by Cloudflare blocking Vercel's IPs on synchronous calls.
          status: 'pending',
        },
      });
    } catch (createErr: any) {
      console.error('[createSabiOrder] order create FAILED after debit — refunding:', createErr?.message);
      await refundSabiWallet(input.userId, chargeKobo, `failed-create-${Date.now()}`, 'Order creation failed — auto refund').catch(() => {});
      return { success: false, error: 'Order creation failed. Your wallet was not charged.' };
    }

    // Save the buyer's "before" screenshot + starting count separately (guarded)
    // — these columns may not exist in prod yet, and this must never break order creation.
    if (input.startScreenshotUrl) {
      prisma.$executeRaw`UPDATE "SabiOrder" SET "startScreenshotUrl" = ${input.startScreenshotUrl} WHERE id = ${order.id}`.catch(() => {});
    }
    if (typeof input.startCount === 'number' && Number.isFinite(input.startCount)) {
      prisma.$executeRaw`UPDATE "SabiOrder" SET "startCount" = ${Math.round(input.startCount)} WHERE id = ${order.id}`.catch(() => {});
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

    // Referral reward is no longer triggered on order — it now fires when the
    // referred user FUNDS ≥ ₦200 (see triggerReferralOnFunding in the wallet
    // callback). Funding is the anti-abuse gate, so there's no referral cap.

    // ── PLACEMENT EMAIL ─────────────────────────────────────────────────────
    // Fire-and-forget — never block the order response for email delivery.
    // Sets expectations: real people, 5min–24hr, refund guarantee.
    if (!input.silent) {
      import('./email').then(({ sendOrderPlacedEmail }) => {
        sendOrderPlacedEmail(
          user.email, user.name, order.id,
          service.name, effectiveQuantity,
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

// NOTE: reads use a raw `SELECT *` rather than prisma.findMany/findFirst.
// Prisma selects EVERY column in the SabiOrder model, so a single column that
// exists in schema.prisma but not in prod Turso (schema lag) makes the whole
// read throw — which silently emptied users' order lists. A raw SELECT returns
// whatever columns actually exist, so it can never break on a missing column.
export async function getSabiOrder(orderId: string, userId: string) {
  try {
    const r = await sabiExecute({
      sql: `SELECT * FROM SabiOrder WHERE id = ? AND userId = ? LIMIT 1`,
      args: [orderId, userId],
    });
    return (r.rows[0] as any) ?? null;
  } catch (error) {
    return null;
  }
}

export async function getSabiOrders(userId: string, limit: number = 50) {
  try {
    const r = await sabiExecute({
      sql: `SELECT * FROM SabiOrder WHERE userId = ? ORDER BY createdAt DESC LIMIT ?`,
      args: [userId, limit],
    });
    return r.rows as any[];
  } catch (error) {
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
