<!-- ╔══════════════════════════════════════════════════════════════════════════╗ -->
<!-- ║  SABI (sability.io) — SYSTEM DOCTRINE · MUST READ FIRST · DO NOT DELETE    ║ -->
<!-- ║  Every agent MUST read and obey this block before changing anything.        ║ -->
<!-- ║  These are hard-won production rules. If a change conflicts with a rule,     ║ -->
<!-- ║  STOP and ask the user. Never remove this block.                            ║ -->
<!-- ╚══════════════════════════════════════════════════════════════════════════╝ -->

# 🛑 SABI SYSTEM DOCTRINE — READ BEFORE ANY CHANGE

## 1. What SABI is
- SABI (sability.io) is an SMM panel: users buy social-media engagement. Orders are pushed to
  **Gamers360** taskers for fulfilment. SABI shares the SAME Turso org (`strixform`) as Gamers360.
- Prices are stored in **kobo** (₦1 = 100 kobo). Pricing is centralized by action in
  `lib/servicesCatalog.ts` (`ACTION_PRICE_KOBO`). Don't hardcode prices elsewhere.

## 2. Auth — never log a user out on a DB hiccup
- `getSabiSession` returns `null` on failure (never throws). Redis is checked first (lazy import,
  must never crash auth), then Turso.
- `withDbTimeout` DEFAULT 6s — MUST stay shorter than the calling route's `maxDuration`
  (google/callback = 25s, login = 30s). If timeout > maxDuration, Vercel kills the function and
  Cloudflare shows "Host Error".
- Login route returns a clean **"Servers are busy" 503** on Turso 429/timeout — never a raw error.
- Google OAuth callback: `await prewarmSessionCache` BEFORE the redirect (a fire-and-forget
  prewarm caused the login loop). Dashboard retries once before redirecting to login.

## 3. Turso protection (SHARED with Gamers360 — the #1 cause of "server busy")
- Both apps hit the same Turso org. "Server busy" on SABI is usually Gamers360 saturating the
  shared DB, or vice-versa. Keep BOTH apps' reads efficient.
- Every aggregate query (GROUP BY/SUM/COUNT/scan) MUST be cached in shared Redis with a long TTL
  (≥ 300s). In-memory-per-instance caches don't count.
- All routes declare `preferredRegion = 'sfo1'` (Turso is in Oregon). Never remove it.

## 4. Order coherence
- Admin can set any order status: pending / processing / in_progress / executing / completed /
  failed / cancelled. Bulk status change exists in admin Orders.
- Service catalog covers 18 platforms incl. Facebook, Google, LinkedIn, App Store, Website,
  Podcast. Icons map in the order/services pages.

## 5. Change discipline
- DB changes ADDITIVE only. Do NOT revert/downgrade corrected values; work forward from latest build.
- Run `npx tsc --noEmit` before every push. Commit messages end with the Co-Authored-By trailer.

<!-- END SYSTEM DOCTRINE — do not delete above this line -->

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
