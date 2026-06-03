import crypto from 'crypto';

const KORAPAY_BASE = 'https://api.korapay.com/merchant/api/v1';
const KORAPAY_SECRET_KEY = process.env.KORAPAY_SECRET_KEY;

export interface KorapayInitializeInput {
  email: string;
  amount: number;
  txRef: string;
  currency?: string;
  redirectUrl?: string;
}

export interface KorapayWebhookPayload {
  event: string;
  data: {
    reference: string;
    status: 'success' | 'failed' | 'pending';
    amount: number;
    currency: string;
    customer?: {
      email: string;
      name?: string;
    };
  };
}

export function generateKorapayTxRef(userId: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `sabi_${userId.substring(0, 8)}_${timestamp}_${random}`;
}

export async function initializeKorapayPayment(
  input: KorapayInitializeInput
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`${KORAPAY_BASE}/charges/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KORAPAY_SECRET_KEY}`,
      },
      body: JSON.stringify({
        reference: input.txRef,
        amount: Math.round(input.amount),
        currency: input.currency || 'NGN',
        narration: `Fund wallet - ₦${input.amount}`,
        customer: {
          email: input.email,
        },
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/sabi/wallet/korapay-webhook`,
        redirect_url: input.redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/sabi/wallet/callback`,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Korapay error: ${response.statusText}`,
      };
    }

    const data = await response.json();

    if (!data.status) {
      return {
        success: false,
        error: data.message || 'Payment initialization failed',
      };
    }

    return {
      success: true,
      data: {
        reference: input.txRef,
        link: data.data?.checkout_url || data.data?.link,
        accessCode: data.data?.access_code,
        publicKey: process.env.NEXT_PUBLIC_KORAPAY_PUBLIC_KEY,
      },
    };
  } catch (error) {
    console.error('Korapay initialization error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment initialization failed',
    };
  }
}

export async function verifyKorapayTransaction(
  reference: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`${KORAPAY_BASE}/charges/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${KORAPAY_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Verification failed: ${response.statusText}`,
      };
    }

    const data = await response.json();

    if (!data.status) {
      return {
        success: false,
        error: data.message || 'Transaction verification failed',
      };
    }

    const chargeStatus = data.data?.status;
    if (chargeStatus !== 'success') {
      return {
        success: false,
        error: `Transaction status: ${chargeStatus}`,
      };
    }

    return {
      success: true,
      data: {
        reference: data.data?.reference,
        amount: data.data?.amount,
        status: data.data?.status,
        customer_email: data.data?.customer?.email,
      },
    };
  } catch (error) {
    console.error('Korapay verification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

export function verifyKorapayWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!KORAPAY_SECRET_KEY) {
    console.error('KORAPAY_SECRET_KEY not set');
    return false;
  }

  const hash = crypto
    .createHmac('sha256', KORAPAY_SECRET_KEY)
    .update(payload)
    .digest('hex');

  return hash === signature;
}

export function parseKorapayWebhook(payload: KorapayWebhookPayload): {
  reference: string;
  status: string;
  amount: number;
  email?: string;
} {
  return {
    reference: payload.data?.reference || '',
    status: payload.data?.status || 'unknown',
    amount: payload.data?.amount || 0,
    email: payload.data?.customer?.email,
  };
}
