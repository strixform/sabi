import crypto from 'crypto';

// Public order-report share tokens. HMAC-signed so a buyer can share a read-only
// proof link without exposing anything guessable and without a DB column.
// token = "<orderId>~<sig>" where sig = HMAC-SHA256(orderId, secret).slice(0,24).

// FAIL-CLOSED: no guessable literal fallback. SABI_INTEGRATION_TOKEN is always set
// (cross-app calls depend on it), so this only throws on a genuinely broken deploy.
const secret = (): string => {
  const s = process.env.SABI_SHARE_SECRET || process.env.SABI_INTEGRATION_TOKEN;
  if (!s) throw new Error("No share-token secret configured (SABI_SHARE_SECRET / SABI_INTEGRATION_TOKEN).");
  return s;
};

export function signOrderToken(orderId: string): string {
  const sig = crypto.createHmac('sha256', secret()).update(orderId).digest('hex').slice(0, 24);
  return `${orderId}~${sig}`;
}

export function verifyOrderToken(token: string): string | null {
  const i = token.lastIndexOf('~');
  if (i < 0) return null;
  const orderId = token.slice(0, i);
  const sig = token.slice(i + 1);
  let expected: string;
  try { expected = crypto.createHmac('sha256', secret()).update(orderId).digest('hex').slice(0, 24); }
  catch { return null; } // misconfigured secret → reject, never validate
  if (sig.length !== expected.length) return null;
  // constant-time compare
  let diff = 0;
  for (let j = 0; j < sig.length; j++) diff |= sig.charCodeAt(j) ^ expected.charCodeAt(j);
  return diff === 0 ? orderId : null;
}
