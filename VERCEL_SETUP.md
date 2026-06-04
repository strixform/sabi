# Vercel Production Environment Setup

**Date**: June 4, 2026  
**Project**: SABI  
**Status**: Live Flutterwave Keys Ready for Configuration

---

## 🔑 Your Flutterwave Keys

These keys have been provided and are ready to configure:

```
NEXT_PUBLIC_FLW_PUBLIC_KEY = FLWPUBK-f8234c75fb12ce9820a874ccf443c58c-X
FLW_SECRET_KEY             = FLWSECK-3e94a34eb88f3ed8009000c315bb9370-19e940de2cbvt-X
FLW_WEBHOOK_HASH           = 3e94a34eb88fef40739968c1
```

---

## ⚠️ IMPORTANT SECURITY NOTES

1. **NEVER commit these keys to git** - Already configured to be ignored
2. **ONLY store in Vercel Environment Variables** - Not in .env files
3. **These are LIVE keys** - All payments go to real accounts
4. **Test thoroughly** before announcing to users
5. **Keep webhook hash secret** - Don't share publicly

---

## Step-by-Step Vercel Configuration

### Step 1: Access Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Select Project: **SABI**
3. Click: **Settings** (top menu)
4. Click: **Environment Variables** (left sidebar)

### Step 2: Add Production Variables

For each variable below, click "Add New Variable":

#### Variable 1: FLW_SECRET_KEY
```
Name:        FLW_SECRET_KEY
Value:       FLWSECK-3e94a34eb88f3ed8009000c315bb9370-19e940de2cbvt-X
Environment: Production (select only)
Click:       Save
```

#### Variable 2: NEXT_PUBLIC_FLW_PUBLIC_KEY
```
Name:        NEXT_PUBLIC_FLW_PUBLIC_KEY
Value:       FLWPUBK-f8234c75fb12ce9820a874ccf443c58c-X
Environment: Production (select only)
Click:       Save
```

#### Variable 3: FLW_WEBHOOK_HASH
```
Name:        FLW_WEBHOOK_HASH
Value:       3e94a34eb88fef40739968c1
Environment: Production (select only)
Click:       Save
```

### Step 3: Verify Existing Variables

Check that these variables are already configured:

```
✓ DATABASE_URL              → Turso database URL
✓ TURSO_AUTH_TOKEN          → Turso auth token
✓ RESEND_API_KEY            → Email service API key
✓ NEXT_PUBLIC_APP_URL       → https://sability.io
✓ NODE_ENV                  → production
✓ NEXT_PUBLIC_GOOGLE_CLIENT_ID
✓ GOOGLE_CLIENT_SECRET
✓ SABI_INTEGRATION_TOKEN    → Integration token for Gamerz360
✓ GAMERZ360_API_URL         → https://gamerz360.com
```

---

## Step 4: Configure Flutterwave Webhook

### In Flutterwave Dashboard:

1. Go to: https://dashboard.flutterwave.com
2. Navigate: **Settings** → **Webhooks**
3. Add Webhook:
   ```
   Event:     Charge Completed
   URL:       https://sability.io/api/sabi/wallet/webhook
   Status:    Active
   ```
4. Save and note the **webhook hash** (should match FLW_WEBHOOK_HASH in Vercel)

---

## Step 5: Deploy to Production

### Option A: Automatic Deploy (Recommended)

```bash
git push origin main
```

This triggers Vercel to:
1. Build the project
2. Run tests
3. Deploy to production
4. Use environment variables from Vercel dashboard

### Option B: Manual Deploy via Vercel CLI

```bash
npm install -g vercel
vercel --prod
```

Monitor deployment at: https://vercel.com/dashboard/sabi → Deployments

---

## Step 6: Verify Production Deployment

### Test 1: Health Check
```bash
curl https://sability.io/api/health
# Expected: 200 OK response
```

### Test 2: Registration Flow
1. Go to https://sability.io/sabi/register
2. Create account with valid email
3. Check email for verification code
4. Complete verification

### Test 3: Wallet Funding (LIVE PAYMENT)
```
1. Log into dashboard
2. Click "Fund Wallet"
3. Enter amount: ₦1,000 (start small to test)
4. Click "Continue to Payment"
5. Complete payment:
   Card: 4242 4242 4242 4242 (Flutterwave test card)
   Expiry: 12/25
   CVV: 123
   Name: Test
6. After payment, verify:
   - Payment completes
   - Dashboard shows ₦1,000 balance
   - Transaction appears in history
   - Webhook logs show receipt
```

### Test 4: Order Placement
```
1. Go to /sabi/services
2. Select service (e.g., Followers)
3. Enter Instagram URL
4. Enter quantity: 50
5. Review pricing
6. Place order
7. Verify:
   - Order created
   - Wallet debited
   - Campaign created in Gamerz360
   - Status shows as "executing"
```

### Test 5: Check Webhook Logs

**In Flutterwave Dashboard:**
1. Settings → Webhooks → View Logs
2. Should see POST request to https://sability.io/api/sabi/wallet/webhook
3. Response should be: `{ "success": true }`

**In Vercel:**
1. Project → Functions → /api/sabi/wallet/webhook
2. Check invocation logs
3. Should see successful responses

---

## Monitoring & Alerts

### Set Up Monitoring

**Option 1: Vercel Analytics (Free)**
1. Vercel Dashboard → Analytics
2. Monitor:
   - Edge Function requests
   - Serverless Function duration
   - Error rates
   - Bandwidth usage

**Option 2: External Monitoring (Recommended)**

**Sentry (Error Tracking)**
```bash
npm install @sentry/nextjs
# Then configure in vercel.json or next.config.ts
```

**LogRocket (Session Replay)**
```bash
npm install logrocket
# Configure in app/layout.tsx for user issues
```

---

## Production Checklist

Before announcing to users:

### Security
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] All environment variables configured in Vercel
- [ ] Flutterwave webhook URL configured
- [ ] No .env files with real credentials in git
- [ ] Rate limiting working

### Functionality
- [ ] User registration works
- [ ] Email verification works
- [ ] Wallet funding works (end-to-end)
- [ ] Orders can be placed
- [ ] Campaign auto-creation works
- [ ] Webhook receives payments

### Performance
- [ ] Page load time < 2 seconds
- [ ] API response time < 200ms
- [ ] Database queries < 50ms
- [ ] No memory leaks (check Vercel logs)

### Monitoring
- [ ] Error tracking set up
- [ ] Payment monitoring set up
- [ ] Performance alerts configured
- [ ] Support team briefed on process

---

## Troubleshooting

### Issue: Payment fails with "Invalid public key"

**Solution:**
1. Verify NEXT_PUBLIC_FLW_PUBLIC_KEY is set in Vercel
2. Redeploy: `git push origin main`
3. Clear browser cache
4. Try again

### Issue: Webhook not received

**Solution:**
1. Verify webhook URL in Flutterwave: https://sability.io/api/sabi/wallet/webhook
2. Check FLW_WEBHOOK_HASH is set in Vercel
3. Check Flutterwave webhook logs for delivery status
4. Check Vercel function logs for errors

### Issue: Wallet not credited after payment

**Solution:**
1. Check Flutterwave webhook status (succeeded?)
2. Check Vercel logs for webhook processing errors
3. Verify transaction in database (check SABI database)
4. Check for error details in Sentry

### Issue: Build fails after pushing

**Solution:**
1. Check Vercel build logs
2. Verify all environment variables exist
3. Run `npm run build` locally to test
4. Check for TypeScript errors: `npm run type-check`

---

## Rollback Plan

If critical issues found in production:

### Immediate Rollback
```bash
# Via Vercel Dashboard:
Deployments → [Previous Deployment] → Click "Redeploy"

# Or via git:
git revert HEAD
git push origin main
```

### Disable Payments (Emergency Only)
Update Vercel env var: `FLUTTERWAVE_DISABLED=true`
This requires code change - contact development team

---

## Post-Launch Monitoring (First 7 Days)

### Daily Checks
- [ ] No critical errors in Sentry
- [ ] Webhook delivery rate > 99%
- [ ] Payment success rate > 98%
- [ ] Average API response time < 200ms
- [ ] No database connectivity issues

### Weekly Report
- [ ] Total transactions processed
- [ ] Total revenue generated
- [ ] User signups
- [ ] User retention rate
- [ ] Most popular services

---

## Support Contacts

For issues with:
- **Flutterwave**: https://support.flutterwave.com
- **Vercel**: https://support.vercel.com
- **Turso DB**: https://turso.tech/support
- **Email (Resend)**: https://resend.com/support

---

## Next Steps

1. ✅ Keys received (DONE)
2. ⏳ Configure variables in Vercel
3. ⏳ Configure webhook in Flutterwave
4. ⏳ Deploy to production (git push)
5. ⏳ Run production tests
6. ⏳ Monitor first 24 hours
7. ⏳ Announce to users

---

**Status**: Ready for production configuration  
**Keys Verified**: ✅  
**Next Action**: Configure in Vercel and deploy
