// Single source for the reseller JWT signing/verifying key. FAIL-CLOSED: if
// JWT_SECRET is missing (or too short to be real), we throw rather than fall back
// to a guessable default — a known signing key = full auth bypass. Callers run
// inside try/catch, so a missing secret refuses auth instead of forging it.
let cached: Uint8Array | null = null;

export function jwtSecret(): Uint8Array {
  if (cached) return cached;
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error("JWT_SECRET is not configured (or too short) — refusing to sign/verify tokens.");
  }
  cached = new TextEncoder().encode(s);
  return cached;
}
