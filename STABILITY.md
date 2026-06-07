# SABI Stability Rules

These rules exist because login/auth broke multiple times from seemingly unrelated changes.
Every contributor (human or AI) must follow them.

---

## Rule 1 — Optional services use lazy imports in core modules

**Bad (breaks login if Redis is down):**
```ts
// sabiAuth.ts
import { getCachedSession } from './redis'; // crashes entire module if Redis fails
```

**Good (Redis failure is isolated):**
```ts
async function tryGetCached(token: string) {
  try { const { getCachedSession } = await import('./redis'); return getCachedSession(token); }
  catch { return null; } // Redis down = null = fallback to DB. Auth still works.
}
```

**Applies to:** Redis, email (Resend), push notifications, any third-party SDK.
**Never applies to:** prisma, bcryptjs, next/headers — these are required.

---

## Rule 2 — Run checks before every push

```bash
bash check.sh
```

TypeScript + build must both pass. If either fails, do not push.

---

## Rule 3 — One concern per commit

Each commit should do ONE thing. Not "perf + layout + rate limiter + 15 page edits."
When something breaks you need to know WHICH commit caused it.

---

## Rule 4 — Core module changes need a catch-and-fallback

When editing sabiAuth.ts, sabiOrderEngine.ts, or any file imported by >5 routes:
- New code must have an explicit catch that preserves old behaviour
- "If my new thing fails, the old thing still works"

---

## Rule 5 — Tag stable states after confirmed deploys

```bash
git tag stable-YYYYMMDD-HHMM -m "Confirmed working"
git push origin --tags
```

Roll back: `git revert HEAD && git push origin main`

---

## Last known stable states

| Date | Tag | What was working |
|------|-----|-----------------|
| 2026-07-07 | stable-2026-07-07 | Email login ✅ Google OAuth ✅ Dashboard ✅ Orders ✅ Admin ✅ |

Update this table after every confirmed stable deploy.
