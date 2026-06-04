# SABI Ecosystem Architecture - MUST READ

**Last Updated:** June 4, 2026  
**Status:** Live Production  
**Read this before any work on this codebase.**

---

## The Three Platforms

### 1. **gamerz360.com** (Main Platform)
**Folder:** `C:\Users\oluse\GAMERS 360\gamers360\`  
**URL:** https://gamerz360.com  
**Database:** Turso SQLite (Oregon region, accessed via sfo1 Vercel)  
**Purpose:** Gamer engagement & earnings platform

**What it does:**
- Users play games, earn points
- Users complete tasks/campaigns for points
- Users withdraw earnings to bank accounts
- Core game economy with 12+ earning sources

**Key Features:**
- Game library (30+ games)
- Campaign/Task system (users complete micro-tasks)
- Withdrawal system (game earnings: 12hr cooldown, tiered discount | task earnings: unlimited, 100% value)
- Referral system
- Achievements & challenges
- Daily spin, mystery box, streaks

**Users:** Gamers, task completers (Nigerian audience)

**Revenue:** Takes ~15% platform fee on task earnings

---

### 2. **ads.gamerz360.com** (Advertiser Network)
**Folder:** `C:\Users\oluse\GAMERS 360\gamers360\` (same folder, different routes)  
**URL:** https://ads.gamerz360.com  
**Database:** Same Turso instance as gamerz360.com  
**Purpose:** Advertiser dashboard for posting engagement tasks

**What it does:**
- Advertisers (brands, SMM businesses) create campaigns
- Campaigns are tasks posted on gamerz360.com main platform
- Advertisers pay for gamer engagement (follows, likes, comments, etc.)
- Track campaign performance in real-time

**Key Features:**
- Campaign creation (followers, likes, comments, shares, etc.)
- Real-time task execution by gamerz360 users
- Performance analytics
- Wallet management (fund campaigns, withdraw payouts)
- Advertiser tiers & trust scoring

**Users:** Brands, agencies, advertisers, SMM resellers

**Revenue Model:** Advertisers pay per task completion

**Important:** Campaigns created on ads.gamerz360.com appear as "tasks" on gamerz360.com main platform for users to complete

---

### 3. **sability.io / SABI** (SMM Reseller Gateway)
**Folder:** `C:\Users\oluse\GAMERS 360\SABI\`  
**URL:** https://sability.io/sabi/  
**Database:** Separate Turso instance (`libsql://sabi-strixform.aws-us-west-2.turso.io`)  
**Purpose:** Bridge SMM users into Gamerz360 ecosystem

**What it does:**
- SMM businesses order "fake followers" / engagement like they would on other SMM sites
- SABI converts these orders into Gamerz360 campaigns automatically
- Gamerz360 users complete these tasks organically
- SABI delivers real engagement from verified Nigerian gamers

**Key Features:**
- SMM-style order interface (simple, familiar to resellers)
- Service types: followers, likes, comments, engagement, views, shares
- Wallet system (fund with Flutterwave, pay for orders)
- Auto-execution: orders → campaigns → fulfilled by gamerz360 users
- API for resellers to integrate programmatically
- Reseller dashboard & order tracking

**Users:** SMM resellers, small agencies, creators buying engagement

**Revenue Model:** Takes margin on each order (SABI price < Advertiser direct price)

---

## How They Connect

```
┌─────────────────────────────────────────────────────────────┐
│ EXTERNAL USERS (SMM Resellers)                              │
│ "I want 1000 followers for my Instagram"                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌─────────────────────────┐
         │   SABI (sability.io)    │
         │   "Order Interface"     │
         │   - Easy UI             │
         │   - Service selection   │
         │   - Pricing             │
         │   - Payment             │
         └────────────┬────────────┘
                     │
         AUTO-EXECUTE (Webhook):
         1. Create SabiOrder
         2. Fund internal advertiser wallet
         3. Create Campaign on ads.gamerz360.com
         4. Set status='live' (instant approval)
                     │
                     ▼
      ┌──────────────────────────────────────┐
      │ ads.gamerz360.com                    │
      │ (Advertiser Network)                 │
      │ - Campaign live                      │
      │ - Tracking enabled                   │
      │ - Real-time execution                │
      └────────────┬─────────────────────────┘
                   │
                   ▼ Tasks feed
      ┌──────────────────────────────────────┐
      │ gamerz360.com (Main Platform)        │
      │ - Users see "Follow @brand_xyz"      │
      │ - Click, complete, earn 50-100 pts   │
      │ - Earn in taskBalance (100% value)   │
      │ - Can withdraw anytime               │
      └────────────┬─────────────────────────┘
                   │
         Task completion webhook:
         - Mark campaign progress
         - Track gamer completion
         - Update campaign % complete
                   │
                   ▼ When complete
      ┌──────────────────────────────────────┐
      │ Campaign Complete                    │
      │ 1000 followers delivered             │
      │ Settlement with advertiser           │
      │ Payout to gamerz360 users            │
      └──────────────────────────────────────┘
```

---

## Database Isolation

| Platform | Database | Connection | Isolation |
|----------|----------|-----------|-----------|
| **gamerz360.com** | `libsql://gamerz360-strixform...` | Turso | ✅ Separate instance |
| **ads.gamerz360.com** | Same as above | Shared | ⚠️ Same DB, different tables/routes |
| **SABI (sability.io)** | `libsql://sabi-strixform...` | Turso | ✅ Separate instance |

**Key Point:** SABI **cannot directly access** gamerz360.com tables. Integration happens via:
- SABI → creates order
- SABI → calls gamerz360 admin API (webhook)
- Gamerz360 → creates campaign
- Gamerz360 → gamerz360 users complete task

---

## User Flows

### Flow 1: Gamer on gamerz360.com
```
Sign Up → Play Games → Earn Points → See Tasks → Complete Tasks → 
Earn More → Withdraw (game=12hr cooldown, tasks=unlimited)
```

### Flow 2: Advertiser on ads.gamerz360.com
```
Sign Up → Create Campaign → Fund Wallet → Post Campaign → 
Campaign appears on gamerz360 as task → Users complete → 
Analytics dashboard shows progress → Settlement
```

### Flow 3: SMM Reseller on SABI (sability.io)
```
Sign Up → Browse Services → Add to Cart → Checkout (Flutterwave) → 
Order Created → Auto-converts to Campaign on gamerz360 → 
Gamerz360 users complete → Order fulfilled → 
Reseller sees delivery status → Withdraw profit
```

---

## Authentication & Sessions

| Platform | Auth Type | Session Storage | Duration |
|----------|-----------|-----------------|----------|
| **gamerz360.com** | Email/Password + Google OAuth | Redis + in-memory cache | 30 days |
| **ads.gamerz360.com** | Shared with gamerz360.com (same auth) | Redis + in-memory cache | 30 days |
| **SABI** | Email/Password + Google OAuth | Cookies (httpOnly) | 30 days |

**Important:** Each platform has separate user accounts. A user on gamerz360.com ≠ user on SABI automatically.

---

## Key Rules & Constraints

### gamerz360.com Rules
- **Game Earnings:** 12-hour cooldown between withdrawals, 50% discount on bonus points
- **Task Earnings:** Unlimited withdrawals, 100% value, no cooldown
- **Minimum Withdrawal:** ₦500 (5,000 points)
- **Daily Cap (Games):** ₦1,750 (7,000 pts after 30% reduction)
- **Daily Cap (Tasks):** Unlimited
- **Passive Earnings Cap:** ₦52.50/day (spin, mystery box, achievements)

### ads.gamerz360.com Rules
- **Advertiser Minimum Wallet:** ₦1,000
- **Campaign Min Quantity:** 50 tasks
- **Campaign Min Price:** ₦100/task
- **Auto-approval:** All campaigns go live immediately
- **Settlement:** When 100% complete

### SABI (sability.io) Rules
- **Minimum Order:** ₦500
- **No Cooldown:** Users can order unlimited times
- **Platform Fee:** 15% of order value
- **Services:** Followers, likes, comments, engagement, views, shares
- **Support:** Nigerian audiences only
- **Auto-execution:** Orders convert to campaigns in <5 seconds

---

## Integration Points (API Webhooks)

### SABI → Gamerz360 (Order Fulfillment)
```
POST /api/admin/sabi/create-campaign
{
  "sabiOrderId": "...",
  "serviceType": "followers",
  "targetUrl": "https://instagram.com/...",
  "quantity": 1000,
  "pricePerTask": 150,  // kobo
  "autoApprove": true
}
```

### Gamerz360 → SABI (Order Status Update)
```
POST [SABI_WEBHOOK_URL] (stored in SABI database)
{
  "sabiOrderId": "...",
  "campaign Campaign_Id": "...",
  "completionPercentage": 45,
  "completedQuantity": 450,
  "status": "executing"
}
```

---

## Deployments

| Platform | Service | Region | Branch | Auto-Deploy |
|----------|---------|--------|--------|------------|
| **gamerz360.com** | Vercel | sfo1 (Firewall: Oregon) | `main` @ strixform/gamers360 | ✅ Yes |
| **ads.gamerz360.com** | Vercel | sfo1 | `main` @ strixform/gamers360 | ✅ Yes |
| **SABI** | Vercel | sfo1 | `main` @ strixform/SABI | ✅ Yes |

---

## Environment Files

### gamerz360.com
- `.env.production.local` → gamerz360 Turso + Flutterwave + Redis

### SABI
- `.env.production` → sabi Turso + Flutterwave + Redis
- `.env` → Same (development mode)

---

## Common Mistakes (Avoid These)

❌ **Mistake 1:** Treating SABI users as gamerz360 users
- Solution: They're separate databases. SABI users ≠ gamerz360 users

❌ **Mistake 2:** Modifying gamerz360 without checking ads impact
- Solution: ads.gamerz360.com shares the same database. Changes affect both.

❌ **Mistake 3:** Assuming SABI can directly query gamerz360 database
- Solution: SABI has no direct DB access. Uses admin API webhook only.

❌ **Mistake 4:** Forgetting 30% game earning reduction
- Solution: Game rewards are BASE_POINTS_PER_GAME=7 (not 10), WIN_BONUS=18 (not 25)

❌ **Mistake 5:** Mixing dual-wallet systems
- Solution: gamerz360 has game vs task earnings. SABI has no earnings (only orders).

---

## Deployment Checklist Before Any Changes

- [ ] Identify which platform(s) you're modifying
- [ ] Check if changes affect other platforms
- [ ] Review ARCHITECTURE_ECOSYSTEM.md for relationships
- [ ] Test locally (if applicable)
- [ ] Build passes without errors
- [ ] Push to correct branch/repo
- [ ] Vercel deploys automatically
- [ ] Test on production URL

---

**Questions?** Read this entire file first, then check the specific platform's README.md.
