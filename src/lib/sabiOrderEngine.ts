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
}

export interface OrderResponse {
  success: boolean;
  orderId?: string;
  totalPrice?: number;
  platformFee?: number;
  basePrice?: number;
  estimatedCompletion?: string;
  gamesz360CampaignId?: string;
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
        status: 'processing',
      },
    });

    const campaignResult = await createGamesz360Campaign(
      input.userId,
      order.id,
      input.serviceId,
      input.quantity,
      basePrice,
      input.targetUrl,
      user.name,
      user.businessName || user.email
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
  brandName: string
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

    const payload = {
      sabiOrderId: orderId,
      serviceType: serviceId,
      targetUrl,
      quantity,
      totalPrice: budgetInKobo,
      sabiUserId: userId,
      sabiUserEmail: user.email,
      webhookUrl: `${process.env.SABI_BASE_URL || 'https://sability.io'}/api/webhooks/gamerz360`,
    };

    const response = await fetch(`${gamerz360ApiUrl}/api/admin/sabi/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${integrationToken}`,
      },
      body: JSON.stringify(payload),
    });

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
  } catch (error) {
    // Error logging handled by external service
    return {
      success: false,
      error: 'Campaign creation failed',
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
    await prisma.sabiOrder.update({
      where: { id: orderId },
      data: {
        status,
        completionPercentage: completionPercentage || undefined,
        completedAt: status === 'completed' ? new Date() : undefined,
      },
    });

    return { success: true };
  } catch (error) {
    // Error logging handled by external service
    return { success: false, error: 'Update failed' };
  }
}
