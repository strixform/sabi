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
- `GLOBAL_MAX_QTY = 10,000` is enforced by an IIFE in servicesCatalog.ts — it overrides all
  individual service `maxQuantity` values at module load. Do not remove it.

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

## 4. Security rules
- **Admin token is env-only.** `SABI_ADMIN_SECRET` environment variable is the ONLY valid admin
  token. There is NO hardcoded fallback token in source. If `SABI_ADMIN_SECRET` is not set,
  token-based admin access is denied. Never add a hardcoded fallback token.
- Admin email: set via `NEXT_PUBLIC_ADMIN_EMAIL` env var. The hardcoded email fallback
  (`olusehinde09@gmail.com`) is intentional as a last resort — do not remove it.
- Admin login page validates token via a server-side probe request (NOT client-side comparison).

## 5. Wallet idempotency — CRITICAL financial rules
- `creditSabiWallet` is idempotent — checks for duplicate `(userId, type='fund', reference)`
  before crediting. Use this for ALL wallet credits from payment providers.
- `wallet/callback/route.ts` MUST use `creditSabiWallet` (not direct wallet update). It does now.
- `wallet/webhook/route.ts` MUST use `creditSabiWallet`. It does.
- `refundSabiWallet` has an idempotency guard on `orderId`. Do not remove it.
- Transaction `type` values: `'fund'` (payment received), `'spend'` (order placed),
  `'refund'` (order refunded), `'bonus'` (audit trail). NEVER use `'deposit'` — it doesn't exist.

## 6. Order coherence
- Admin can set any order status: pending / processing / in_progress / executing / completed /
  failed / cancelled. Bulk status change exists in admin Orders.
- Service catalog covers 18 platforms incl. Facebook, Google, LinkedIn, App Store, Website,
  Podcast. Icons map in the order/services pages.
- `createSabiOrder` does NOT call Gamers360 synchronously — the cron job handles submission
  every 5 minutes. `createGamesz360Campaign` in `sabiOrderEngine.ts` is defined but NOT called
  from `createSabiOrder` — it exists as a reference only.

## 7. Cron order submission
- `/api/sabi/cron/process-scheduled` picks up `status='pending' AND gamesz360CampaignId IS NULL`.
- Takes max 10 orders per run. `maxDuration = 25`. Requires `Authorization: Bearer {CRON_SECRET}`.
- On success: status → 'executing', stores `gamesz360CampaignId`. On failure: refunds wallet atomically.
- The UA header is spoofed to bypass Cloudflare WAF (Cloudflare blocks Vercel server-to-server calls).

## 8. Schema migration
- No automatic migration runner. All prod schema changes go via `/api/sabi/admin/migrate`.
- The migrate endpoint accepts an `action` param: `create_referral_table`, `check_tables`,
  `add_sabiuser_columns`, `add_config_columns`, `create_custom_request_table`.
- `SabiOrder.targetingNote` exists in the Turso DB (added via raw DDL) but NOT in Prisma schema.
  Write to it via `prisma.$executeRawUnsafe` — not via Prisma model update.
- DB changes ADDITIVE only. Never DROP or rename columns.

## 9. Dashboard Recent Orders
- The dashboard page (`/sabi/dashboard`) fetches orders and renders up to 5 most recent.
- Status color coding: blue=executing/processing, green=completed, yellow=pending, red=failed/cancelled.
- Do NOT replace this with a hardcoded stub.

## 10. Change discipline
- DB changes ADDITIVE only. Do NOT revert/downgrade corrected values; work forward from latest build.
- Run `npx tsc --noEmit` before every push. Commit messages end with the Co-Authored-By trailer.
- `sabiAdsIntegration.ts` is legacy dead code (defaults to localhost:3000). Do not call it.
- Owlet shim files (`owlet*.ts`) re-export from their `sabi*` equivalents. They are harmless
  legacy wrappers. Do not add new owlet files or expand existing ones.

<!-- END SYSTEM DOCTRINE — do not delete above this line -->

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
