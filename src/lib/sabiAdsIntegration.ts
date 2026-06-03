const ADS_API_BASE = process.env.NEXT_PUBLIC_ADS_API_URL || 'http://localhost:3000/api/ads';
const ADS_SECRET_KEY = process.env.ADS_INTEGRATION_SECRET;

export interface CreateAdsAdvertiserInput {
  sabiOrderId: string;
  email: string;
  name: string;
  businessName: string;
}

export interface CreateAdsCampaignInput {
  advertiserId: string;
  serviceId: string;
  quantity: number;
  budgetInKobo: number;
  targetUrl: string;
  taskType: string;
}

export async function createAdsAdvertiser(input: CreateAdsAdvertiserInput): Promise<{
  success: boolean;
  advertiserId?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${ADS_API_BASE}/advertisers/create-internal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Integration-Secret': ADS_SECRET_KEY || '',
      },
      body: JSON.stringify({
        sabiOrderId: input.sabiOrderId,
        email: input.email,
        name: input.name,
        businessName: input.businessName,
        isSabiOrder: true,
      }),
    });

    if (!response.ok) {
      return { success: false, error: `Failed: ${response.statusText}` };
    }

    const data = await response.json();
    return {
      success: data.success,
      advertiserId: data.advertiserId,
      error: data.error,
    };
  } catch (error) {
    console.error('Advertiser creation error:', error);
    return { success: false, error: 'API call failed' };
  }
}

export async function createAdsCampaign(input: CreateAdsCampaignInput): Promise<{
  success: boolean;
  campaignId?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${ADS_API_BASE}/campaigns/create-auto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Integration-Secret': ADS_SECRET_KEY || '',
      },
      body: JSON.stringify({
        advertiserId: input.advertiserId,
        taskType: input.taskType,
        quantity: input.quantity,
        targetUrl: input.targetUrl,
        budgetInKobo: input.budgetInKobo,
        source: 'sabi',
        autoApprove: true,
      }),
    });

    if (!response.ok) {
      return { success: false, error: `Failed: ${response.statusText}` };
    }

    const data = await response.json();
    return {
      success: data.success,
      campaignId: data.campaignId,
      error: data.error,
    };
  } catch (error) {
    console.error('Campaign creation error:', error);
    return { success: false, error: 'API call failed' };
  }
}

export async function getCampaignStatus(campaignId: string): Promise<{
  success: boolean;
  status?: string;
  completionPercentage?: number;
  error?: string;
}> {
  try {
    const response = await fetch(`${ADS_API_BASE}/campaigns/${campaignId}/status`, {
      method: 'GET',
      headers: {
        'X-Integration-Secret': ADS_SECRET_KEY || '',
      },
    });

    if (!response.ok) {
      return { success: false, error: 'Not found' };
    }

    const data = await response.json();
    return {
      success: data.success,
      status: data.status,
      completionPercentage: data.completionPercentage,
    };
  } catch (error) {
    return { success: false, error: 'Status check failed' };
  }
}

export function verifyAdsWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', ADS_SECRET_KEY || '')
    .update(payload)
    .digest('hex');
  return hash === signature;
}
