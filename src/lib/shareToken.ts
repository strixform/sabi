import crypto from 'crypto';

// Public order-report share tokens. HMAC-signed so a buyer can share a read-only
// proof link without exposing anything guessable and without a DB column.
// token = "<orderId>~<sig>" where sig = HMAC-SHA256(orderId, secret).slice(0,24).

const secret = () => process.env.SABI_SHARE_SECRET || process.env.SABI_INTEGRATION_TOKEN || 'sabi-share-fallback';

export function signOrderToken(orderId: string): string {
  const sig = crypto.createHmac('sha256', secret()).update(orderId).digest('hex').slice(0, 24);
  return `${orderId}~${sig}`;
}

export function verifyOrderToken(token: string): string | null {
  const i = token.lastIndexOf('~');
  if (i < 0) return null;
  const orderId = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = crypto.createHmac('sha256', secret()).update(orderId).digest('hex').slice(0, 24);
  if (sig.length !== expected.length) return null;
  // constant-time compare
  let diff = 0;
  for (let j = 0; j < sig.length; j++) diff |= sig.charCodeAt(j) ^ expected.charCodeAt(j);
  return diff === 0 ? orderId : null;
}
