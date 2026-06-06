import { prisma } from './prisma';
import { getService, calculatePrice, validateOrder } from './sabiServices';
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
    const validation = validateOrder(input.serviceId, input.quantity, input.targetUrl);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const service = getService(input.serviceId);
    if (!service) {
      return { success: false, error: 'Service not found' };
    }

    const totalPrice = calculatePrice(input.serviceId, input.quantity);
    if (!totalPrice) {
      return { success: false, error: 'Invalid quantity for service' };
    }

    const basePrice = service.pricePerUnit * input.quantity;
    const platformFee = totalPrice - basePrice;

    const user = await prisma.sabiUser.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const debitResult = await debitSabiWallet(input.userId, totalPrice, '');
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
        discountAmount: input.discountAmount || 0,
        scheduledAt: input.scheduledAt || null,
        status: input.scheduledAt ? 'pending' : 'processing',
      },
    });

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

    // Trigger referral reward on first paid order (fire-and-forget)
    prisma.sabiReferral.findFirst({ where: { refereeId: input.userId, triggeredAt: null } }).then(async ref => {
      if (!ref) return;
      await prisma.sabiReferral.update({ where: { id: ref.id }, data: { triggeredAt: new Date() } });
      // Credit referrer ₦500 (50000 kobo)
      const [referrer, referee] = await Promise.all([
        prisma.sabiUser.findUnique({ where: { id: ref.referrerId }, select: { email: true, name: true } }),
        prisma.sabiUser.findUnique({ where: { id: ref.refereeId }, select: { email: true, name: true } }),
      ]);
      const rewardKobo = 50000;
      await Promise.all([
        prisma.sabiWallet.update({ where: { userId: ref.referrerId }, data: { balance: { increment: rewardKobo }, totalFunded: { increment: rewardKobo } } }),
        prisma.sabiWallet.update({ where: { userId: ref.refereeId }, data: { balance: { increment: rewardKobo }, totalFunded: { increment: rewardKobo } } }),
        prisma.sabiReferral.update({ where: { id: ref.id }, data: { referrerPaid: true, refereePaid: true } }),
      ]);
      const { sendReferralRewardEmail } = await import('./email');
      if (referrer) sendReferralRewardEmail(referrer.email, referrer.name, 500, 'referrer');
      if (referee) sendReferralRewardEmail(referee.email, referee.name, 500, 'referee');
    }).catch(() => {});

    if (input.scheduledAt) {
      return { success: true, orderId: order.id, totalPrice, basePrice, platformFee, estimatedCompletion: service.estimatedDelivery, scheduled: true };
    }

    const campaignResult = await createGamesz360Campaign(
      input.userId,
      order.id,
      input.serviceId,
      input.quantity,
      basePrice,
      input.targetUrl,
      user.name,
      user.businessName || user.email,
      {
        audienceGender: input.audienceGender,
        audienceLocation: input.audienceLocation,
        commentGender: input.commentGender,
        commentInstructions: input.commentInstructions,
      }
    );

    if (campaignResult.success && campaignResult.campaignId) {
      await prisma.sabiOrder.update({
        where: { id: order.id },
        data: {
          gamesz360CampaignId: campaignResult.campaignId,
          gamesz360AdvertiserId: campaignResult.advertiserId,
          status: 'executing',
          estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return {
        success: true,
        orderId: order.id,
        totalPrice: totalPrice,
        basePrice: basePrice,
        platformFee: platformFee,
        estimatedCompletion: service.estimatedDelivery,
        gamesz360CampaignId: campaignResult.campaignId,
      };
    } else {
      await refundSabiWallet(input.userId, totalPrice, order.id, 'Campaign creation failed');
      await prisma.sabiOrder.update({
        where: { id: order.id },
        data: { status: 'failed' },
      });

      return {
        success: false,
        error: campaignResult.error || 'Failed to create campaign',
      };
    }
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

    const totalPrice = order.totalPrice + order.platformFee;
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
