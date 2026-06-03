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
    console.error('Order creation error:', error);
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
    const mockCampaignId = `sabi_${orderId.substring(0, 8)}`;
    const mockAdvertiserId = `adv_sabi_${userId.substring(0, 8)}`;

    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      success: true,
      campaignId: mockCampaignId,
      advertiserId: mockAdvertiserId,
    };
  } catch (error) {
    console.error('Campaign creation error:', error);
    return {
      success: false,
      error: 'Failed to create campaign',
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
    console.error('Get order error:', error);
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
    console.error('Get orders error:', error);
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
    console.error('Cancel order error:', error);
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
    console.error('Update order error:', error);
    return { success: false, error: 'Update failed' };
  }
}
