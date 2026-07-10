import crypto from 'crypto';

/**
 * Cryptomus crypto-payment provider for SABI wallet funding.
 * Mirrors the Flutterwave/Korapay providers: initialize a hosted checkout, then
 * credit the wallet from a signed webhook (idempotent on the order_id reference).
 *
 * Invoices are denominated in NGN so the credited amount maps 1:1 to the wallet
 * (kobo = amount * 100), same as the card providers. Cryptomus quotes the crypto
 * equivalent to the payer at checkout. Override with CRYPTOMUS_FIAT_CURRENCY.
 *
 * Env (set in Vercel — pulls empty locally):
 *   CRYPTOMUS_MERCHANT_UUID     — merchant UUID from the Cryptomus dashboard
 *   CRYPTOMUS_PAYMENT_API_KEY   — Payment API key (NOT the payout key)
 *   CRYPTOMUS_FIAT_CURRENCY     — optional, defaults to 'NGN'
 */

const CRYPTOMUS_BASE = 'https://api.cryptomus.com/v1';
const MERCHANT = process.env.CRYPTOMUS_MERCHANT_UUID || '';
const API_KEY = process.env.CRYPTOMUS_PAYMENT_API_KEY || '';
const FIAT = process.env.CRYPTOMUS_FIAT_CURRENCY || 'NGN';

export function cryptomusConfigured(): boolean {
  return !!MERCHANT && !!API_KEY;
}

export interface CryptomusInitInput {
  userId: string;
  email?: string;
  amount: number; // in NGN (naira)
  orderId: string;
  redirectUrl?: string;
}

/** Reference embeds the FULL userId (lowercase-alnum cuid) so the webhook can
 *  attribute the payment without a DB lookup — same scheme as the FLW tx_ref. */
export function generateCryptomusOrderId(userId: string): string {
  const ts = Date.now();
  const rand = crypto.randomBytes(4).toString('hex');
  return `sabicm_${userId}_${ts}_${rand}`;
}

/** Cryptomus request/webhook signature: md5( base64(body) + apiKey ). */
function sign(bodyStr: string): string {
  const b64 = Buffer.from(bodyStr).toString('base64');
  return crypto.createHash('md5').update(b64 + API_KEY).digest('hex');
}

export async function createCryptomusInvoice(
  input: CryptomusInitInput
): Promise<{ success: boolean; url?: string; uuid?: string; error?: string }> {
  if (!cryptomusConfigured()) return { success: false, error: 'Crypto payments are not configured' };
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL;
    const body = {
      amount: input.amount.toFixed(2),
      currency: FIAT,
      order_id: input.orderId,
      url_callback: `${base}/api/sabi/wallet/cryptomus-webhook`,
      url_return: input.redirectUrl || `${base}/sabi/wallet/callback`,
      url_success: input.redirectUrl || `${base}/sabi/wallet/callback`,
      // Recover the payer even if the reference is ever reformatted.
      additional_data: input.userId,
      lifetime: 3600, // invoice valid 1h
    };
    const bodyStr = JSON.stringify(body);

    const res = await fetch(`${CRYPTOMUS_BASE}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        merchant: MERCHANT,
        sign: sign(bodyStr),
      },
      body: bodyStr,
    });

    const data = await res.json().catch(() => ({} as any));
    if (!res.ok || data?.state !== 0 || !data?.result?.url) {
      return { success: false, error: data?.message || `Cryptomus error: ${res.statusText}` };
    }

    return { success: true, url: data.result.url, uuid: data.result.uuid };
  } catch (error) {
    console.error('Cryptomus init error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Payment initialization failed' };
  }
}

export interface CryptomusWebhook {
  type?: string;
  uuid?: string;
  order_id?: string;
  amount?: string;
  payment_amount?: string;
  merchant_amount?: string;
  currency?: string;
  status?: string;
  additional_data?: string;
  sign?: string;
}

/**
 * Verify a webhook. Cryptomus signs md5( base64(json_without_sign) + apiKey )
 * where the JSON is PHP json_encode (forward slashes escaped as \/). We reproduce
 * that, and also try the un-escaped form for resilience across encoders.
 */
export function verifyCryptomusWebhook(rawBody: string): { ok: boolean; data?: CryptomusWebhook } {
  if (!API_KEY) return { ok: false };
  let data: CryptomusWebhook;
  try { data = JSON.parse(rawBody); } catch { return { ok: false }; }

  const received = data.sign;
  if (!received) return { ok: false };

  const { sign: _omit, ...rest } = data;
  const jsonStr = JSON.stringify(rest);
  const candidates = [
    jsonStr.replace(/\//g, '\\/'), // PHP json_encode default (slashes escaped)
    jsonStr,                       // un-escaped fallback
  ];

  for (const c of candidates) {
    const expected = crypto.createHash('md5').update(Buffer.from(c).toString('base64') + API_KEY).digest('hex');
    if (expected.length === received.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received))) {
      return { ok: true, data };
    }
  }
  return { ok: false };
}

/** Statuses that mean the money is settled and the wallet should be credited. */
export function cryptomusIsPaid(status?: string): boolean {
  return status === 'paid' || status === 'paid_over';
}

/** Pull the userId out of the reference (`sabicm_<userId>_...`), falling back to additional_data. */
export function cryptomusUserId(data: CryptomusWebhook): string | null {
  const m = String(data.order_id || '').match(/^sabicm_([a-z0-9]+)_/);
  if (m) return m[1];
  const add = String(data.additional_data || '').trim();
  return /^[a-z0-9]+$/i.test(add) ? add : null;
}
