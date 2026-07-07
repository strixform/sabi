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
): Promise<{ success: boolean; status?: string; amount?: number; txRef?: string; customerEmail?: string; error?: string }> {
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
      txRef: data.data.tx_ref as string,
      customerEmail: data.data.customer?.email as string | undefined,
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

// ─── Static (dedicated) virtual account ────────────────────────────────────
// Creates a PERMANENT NGN virtual account tied to one customer. Regulation
// (NIBSS/CBN) requires a national ID on permanent accounts; we pass NIN so users
// never have to surrender a BVN. Returns Flutterwave's raw message on failure so
// the caller can surface exactly why (e.g. "virtual accounts not enabled on this
// account" or "invalid nin") — important because we can't test with live keys locally.
export interface FlwVirtualAccountInput {
  email: string;
  nin: string;
  txRef: string;
  firstname?: string;
  lastname?: string;
  phonenumber?: string;
  narration?: string;
}

export async function createStaticVirtualAccount(
  input: FlwVirtualAccountInput
): Promise<{
  success: boolean;
  data?: { accountNumber: string; bankName: string; accountName?: string; orderRef?: string; flwRef?: string };
  error?: string;
}> {
  try {
    const res = await fetch(`${FLW_BASE_URL}/virtual-account-numbers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
      },
      body: JSON.stringify({
        email: input.email,
        is_permanent: true, // static / reusable — the "dedicated account" the user keeps
        tx_ref: input.txRef,
        nin: input.nin, // national ID in place of BVN
        narration: input.narration || 'SABI Wallet',
        ...(input.firstname ? { firstname: input.firstname } : {}),
        ...(input.lastname ? { lastname: input.lastname } : {}),
        ...(input.phonenumber ? { phonenumber: input.phonenumber } : {}),
      }),
    });

    const data = await res.json().catch(() => ({}));
    const acct = data?.data;
    if (!res.ok || data?.status !== 'success' || !acct?.account_number) {
      console.error('[createStaticVirtualAccount] FLW rejected:', res.status, JSON.stringify(data)?.slice(0, 400));
      return { success: false, error: data?.message || `Flutterwave error (${res.status})` };
    }

    return {
      success: true,
      data: {
        accountNumber: acct.account_number,
        bankName: acct.bank_name,
        accountName: acct.note || acct.narration || input.narration,
        orderRef: acct.order_ref,
        flwRef: acct.flw_ref,
      },
    };
  } catch (error) {
    console.error('[createStaticVirtualAccount] error:', (error as Error)?.message);
    return { success: false, error: 'Virtual account request failed' };
  }
}

// List successful transactions for a customer email (used to reconcile dedicated
// virtual-account transfers that the webhook didn't attribute). Returns the raw
// FLW transaction array (empty on any error).
export async function listFlwTransactionsByEmail(
  customerEmail: string,
  fromDate?: string
): Promise<any[]> {
  try {
    const qs = new URLSearchParams();
    qs.set('customer_email', customerEmail);
    qs.set('status', 'successful');
    if (fromDate) qs.set('from', fromDate);
    const res = await fetch(`${FLW_BASE_URL}/transactions?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` },
    });
    if (!res.ok) return [];
    const data = await res.json().catch(() => ({}));
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

// Recent successful transactions across the merchant (no email filter) — used as a
// fallback so we can attribute a dedicated-account inflow by its account number
// even when Flutterwave files it under a different customer email.
export async function listFlwRecentSuccessful(fromDate?: string): Promise<any[]> {
  try {
    const qs = new URLSearchParams();
    qs.set('status', 'successful');
    if (fromDate) qs.set('from', fromDate);
    const res = await fetch(`${FLW_BASE_URL}/transactions?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` },
    });
    if (!res.ok) return [];
    const data = await res.json().catch(() => ({}));
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
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
