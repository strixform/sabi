# SABI Production Deployment Checklist

**Target Deployment Date**: June 4, 2026  
**Status**: 🟢 Ready for deployment  
**Flutterwave Keys Status**: ✅ Received and ready to configure

---

## Pre-Deployment (Before Vercel Configuration)

### Code Quality
- [x] All console.log statements removed
- [x] Error handling reviewed
- [x] No hardcoded secrets in code
- [x] All environment variables use process.env
- [x] Build succeeds locally: `npm run build`
- [x] Type checking passes: `npm run type-check`

### Security
- [x] HTTPS enforced (automatic on Vercel)
- [x] Session cookies secured (httpOnly, secure, sameSite)
- [x] Password hashing implemented (bcryptjs)
- [x] Rate limiting active
- [x] Webhook signature verification
- [x] No SQL injection vectors (Prisma ORM)
- [x] User isolation in database queries
- [x] CSRF protection (SameSite cookies)

### Documentation
- [x] SECURITY_AUDIT.md created
- [x] DEPLOYMENT_GUIDE.md created
- [x] VERCEL_SETUP.md created
- [x] API documentation ready (/sabi/docs)

---

## Vercel Configuration (TO DO - You)

### Environment Variables Setup

**IMPORTANT**: Configure these in Vercel Dashboard → Settings → Environment Variables

#### New Flutterwave Keys (LIVE)
```
☐ FLW_SECRET_KEY = FLWSECK-3e94a34eb88f3ed8009000c315bb9370-19e940de2cbvt-X
☐ NEXT_PUBLIC_FLW_PUBLIC_KEY = FLWPUBK-f8234c75fb12ce9820a874ccf443c58c-X
☐ FLW_WEBHOOK_HASH = 3e94a34eb88fef40739968c1
```

#### Verify Existing Variables
```
☐ DATABASE_URL (Turso production URL)
☐ TURSO_AUTH_TOKEN
☐ RESEND_API_KEY
☐ NEXT_PUBLIC_APP_URL = https://sability.io
☐ NODE_ENV = production
☐ NEXT_PUBLIC_GOOGLE_CLIENT_ID
☐ GOOGLE_CLIENT_SECRET
☐ SABI_INTEGRATION_TOKEN
☐ GAMERZ360_API_URL
```

### Flutterwave Dashboard Configuration
```
☐ Go to Settings → Webhooks
☐ Add webhook URL: https://sability.io/api/sabi/wallet/webhook
☐ Event: Charge Completed
☐ Status: Active
☐ Note webhook hash (should match FLW_WEBHOOK_HASH)
```

---

## Deployment

### Deploy to Production
```bash
☐ git push origin main
☐ Wait for Vercel deployment (check dashboard)
☐ Verify build succeeded (no errors)
☐ Check deployment URL: https://sability.io
```

### Verify Deployment
```bash
☐ curl https://sability.io/api/health → 200 OK
☐ Visit https://sability.io/sabi/login → Page loads
☐ No error messages in browser console (F12)
```

---

## Testing (CRITICAL - Must Complete)

### Test 1: User Registration & Verification
```
Steps:
1. Go to https://sability.io/sabi/register
2. Enter: email, name, password, confirm password
3. Click "Create Account"
4. Check email for verification code
5. Enter code on verification page
6. Verify dashboard loads

Expected Results:
☐ No errors during registration
☐ Email received with verification code
☐ Code verification succeeds
☐ Logged into dashboard
☐ Balance shows ₦0
```

### Test 2: Wallet Funding (REAL PAYMENT - ₦1,000)
```
Steps:
1. On dashboard, click "Fund Wallet"
2. Enter amount: 1000
3. Click "Continue to Payment"
4. Flutterwave modal appears
5. Enter card: 4242 4242 4242 4242
6. Expiry: 12/25
7. CVV: 123
8. Name: Test User
9. Click Pay
10. Wait for success message
11. Return to dashboard

Expected Results:
☐ Flutterwave modal loads
☐ Payment processes (may ask for OTP: 123456)
☐ Payment succeeds
☐ Dashboard balance updates to ₦1,000
☐ Transaction appears in history
☐ No error messages

Verify in Background:
☐ Check Flutterwave webhook logs (should show POST)
☐ Check Vercel logs (function should complete successfully)
☐ Check SABI database (transaction created, wallet updated)
```

### Test 3: Order Placement
```
Steps:
1. From dashboard, click "Place Order" or go to /sabi/services
2. Select service: "Nigerian Followers"
3. Enter URL: https://instagram.com/testaccount
4. Enter quantity: 100
5. Review pricing
6. Click "Place Order"
7. Confirm order

Expected Results:
☐ Service selection works
☐ URL validation passes
☐ Pricing calculation correct (100 × base price + 15% fee)
☐ Order created successfully
☐ Wallet balance debited by order amount
☐ Order shows status "executing"
☐ Order linked to Gamerz360 campaign
☐ No error messages
```

### Test 4: Webhook Reception & Processing
```
Verify:
1. After placing order, check Flutterwave webhook logs
   - Should show POST request to https://sability.io/api/sabi/wallet/webhook
   - Response should be { "success": true }

2. Check Vercel function logs
   - No errors processing webhook
   - Wallet credited successfully

3. In SABI database
   - Transaction record created
   - Correct amount credited
   - Correct user ID
```

### Test 5: Duplicate Payment Prevention
```
Steps:
1. Use Postman or curl to replay webhook
2. Send exact same webhook payload again

Expected Results:
☐ Webhook silently accepts (no error)
☐ Wallet NOT credited twice
☐ Only one transaction in database
☐ Idempotent behavior confirmed
```

### Test 6: Error Handling
```
Test various error scenarios:

1. Invalid amount
   POST /api/sabi/wallet/fund { amount: 100 }
   Expected: { error: "Amount must be between..." }

2. Insufficient balance
   Try to place order > wallet balance
   Expected: { error: "Insufficient balance" }

3. Invalid webhook signature
   POST /api/sabi/wallet/webhook with bad signature
   Expected: { success: true } (silent rejection)

Verify: No error messages expose internal details
```

---

## Monitoring (First 24 Hours)

### Hourly Checks
```
☐ Check Vercel dashboard for errors
☐ Check Sentry (if configured) for exceptions
☐ Monitor API response times (should be < 200ms)
☐ Verify no deployment issues
```

### Key Metrics to Monitor
```
☐ Total requests/hour
☐ Error rate (target: < 0.1%)
☐ Failed webhook deliveries
☐ Failed order placements
☐ Database connection pool status
```

### Create Test Account for Monitoring
```
☐ Set up admin account
☐ Monitor dashboard for activity
☐ Track orders and payments
☐ Keep webhook logs accessible
```

---

## Post-Deployment (After 24 Hours Success)

### Finalize Setup
```
☐ Backup database
☐ Set up automated alerts
☐ Configure external logging (Sentry/LogRocket)
☐ Set up status page (optional)
☐ Document support procedures
```

### Communication
```
☐ Notify stakeholders (deployment complete)
☐ Prepare user onboarding materials
☐ Set up support email/chat
☐ Brief support team on common issues
```

---

## Rollback Procedure (If Issues Found)

### Immediate Actions
```
☐ Stop taking new payments (if critical)
☐ Notify stakeholders
☐ Check Vercel deployment logs
☐ Check error tracking (Sentry)
```

### Rollback via Vercel
```
Vercel Dashboard → Deployments → [Previous] → Redeploy
```

### Or via Git
```bash
git revert HEAD
git push origin main
```

---

## Success Criteria

✅ **Deployment is successful when:**
1. All tests pass (user registration, payments, orders)
2. No critical errors in logs for 2+ hours
3. Webhook delivery success rate > 99%
4. Payment success rate > 98%
5. API response times < 200ms
6. No user reports of issues

---

## Support Escalation

### Critical Issues (Immediate)
- Payment processing down
- Database connection lost
- Webhook not working
- Authentication broken

**Contact**: [Your technical team]

### High Priority (Within 1 hour)
- High error rates
- Slow response times
- Webhook delivery failures

**Contact**: [Your technical team]

### Medium Priority (Within 4 hours)
- UI issues
- Data display problems
- Non-critical errors

**Contact**: [Your technical team]

---

## Timeline

```
Today (June 4, 2026):
☐ Configure environment variables in Vercel
☐ Configure webhook in Flutterwave
☐ Deploy to production (git push)
☐ Run all tests (should take 30-60 minutes)

After Testing:
☐ Verify all systems working
☐ Monitor for 24 hours
☐ Notify stakeholders of successful deployment
```

---

## Final Notes

- **These keys are LIVE** - All payments go to real accounts
- **Start small** - Test with ₦1,000 first
- **Monitor closely** - Watch logs for first 24 hours
- **Document everything** - Keep notes of any issues
- **Have rollback ready** - Just in case something goes wrong

✅ **You're ready to deploy!**

After you configure the environment variables in Vercel and test, the platform will be live and ready for users.

---

**Status**: 🟢 Ready for production  
**Next Step**: Configure variables in Vercel and deploy
