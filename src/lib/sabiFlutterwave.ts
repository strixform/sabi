import crypto from 'crypto';

const FLW_BASE_URL = 'https://api.flutterwave.com/v3';
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
const FLW_PUBLIC_KEY = process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY;
const FLW_WEBHOOK_HASH = process.env.FLW_WEBHOOK_HASH;

export interface FlwInitializePaymentInput {
  email: string;
  amount: number;
  txRef: string;
  currency?: string;
  redirectUrl?: string;
}

export interface FlwWebhookPayload {
  event: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    status: string;
    amount: number;
    currency: string;
    customer: {
      id: number;
      email: string;
      name: string;
    };
  };
}

export function generateFlwTxRef(userId: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `sabi_${userId.substring(0, 8)}_${timestamp}_${random}`;
}

export async function initializeFlwPayment(
  input: FlwInitializePaymentInput
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`${FLW_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FLW_SECRET_KEY}`,
      },
      body: JSON.stringify({
        tx_ref: input.txRef,
        amount: input.amount,
        currency: input.currency || 'NGN',
        redirect_url: input.redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/wallet/callback`,
        customer: {
          email: input.email,
        },
        customizations: {
          title: 'Sabi Wallet',
          description: `Fund wallet - ₦${input.amount}`,
          logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
        },
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Flutterwave error: ${response.statusText}`,
      };
    }

    const data = await response.json();

    if (!data.status || data.status !== 'success') {
      return {
        success: false,
        error: data.message || 'Payment initialization failed',
      };
    }

    return {
      success: true,
      data: {
        link: data.data.link,
        txRef: input.txRef,
      },
    };
  } catch (error) {
    console.error('Flutterwave error:', error);
    return { success: false, error: 'Payment initialization failed' };
  }
}

export async function verifyFlwTransaction(
  transactionIdOrRef: string
): Promise<{ success: boolean; status?: string; amount?: number; error?: string }> {
  try {
    // Check if it's a numeric ID or a string reference
    const isNumericId = /^\d+$/.test(transactionIdOrRef);

    const url = isNumericId
      ? `${FLW_BASE_URL}/transactions/${transactionIdOrRef}/verify`
      : `${FLW_BASE_URL}/transactions/verify_by_reference?tx_ref=${transactionIdOrRef}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FLW_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      console.error('[VERIFICATION] HTTP error:', response.status, response.statusText);
      return { success: false, error: 'Transaction not found' };
    }

    const data = await response.json();

    if (data.status !== 'success') {
      console.error('[VERIFICATION] Status not success:', data.status);
      return { success: false, error: 'Verification failed' };
    }

    console.log('[VERIFICATION] Successful:', {
      transactionId: data.data.id,
      status: data.data.status,
      amount: data.data.amount,
    });

    return {
      success: true,
      status: data.data.status,
      amount: data.data.amount,
    };
  } catch (error) {
    console.error('[VERIFICATION] Error:', error);
    return { success: false, error: 'Verification failed' };
  }
}

export function verifyFlwWebhookSignature(payload: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha256', FLW_WEBHOOK_HASH || '')
    .update(payload)
    .digest('hex');
  return hash === signature;
}

export function parseFlwWebhook(payload: any): FlwWebhookPayload | null {
  try {
    return {
      event: payload.event,
      data: {
        id: payload.data.id,
        tx_ref: payload.data.tx_ref,
        flw_ref: payload.data.flw_ref,
        status: payload.data.status,
        amount: payload.data.amount,
        currency: payload.data.currency,
        customer: {
          id: payload.data.customer.id,
          email: payload.data.customer.email,
          name: payload.data.customer.name,
        },
      },
    };
  } catch (error) {
    return null;
  }
}

export async function disburseFlwFunds(): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function getFlwBankList(): Promise<any> {
  try {
    const response = await fetch(`${FLW_BASE_URL}/banks`, {
      headers: {
        'Authorization': `Bearer ${FLW_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    return null;
  }
}
