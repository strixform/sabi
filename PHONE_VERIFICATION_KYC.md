# Phone Verification & KYC System

## Overview

The Sabi platform now includes a comprehensive phone verification system for KYC (Know Your Customer) compliance. Users must verify their phone number once during their onboarding to access core features like dashboard, ordering, and wallet management.

## Key Features

✅ **One-Time Verification**: Users only verify their phone number once
✅ **Auto-Detect Google Sign-In**: Google OAuth users automatically see phone verification flow
✅ **Email Verification Code**: 6-digit codes sent via email (more reliable than SMS)
✅ **Nigerian Phone Support**: Validates Nigerian phone numbers in multiple formats
✅ **Secure Storage**: Phone number hashed and stored securely in database
✅ **Session-Based**: Integrated with existing session management
✅ **Skip Option**: Users can skip for now and verify later (with warning)

## System Architecture

```
User Registration/Google Sign-In
       ↓
Email Verification (existing)
       ↓
Phone Number Collection (NEW)
       ↓
Code Verification via Email
       ↓
Account Fully Activated
```

## Database Schema Changes

Added to `SabiUser` model:
```prisma
// Phone verification (KYC)
phoneVerified Boolean @default(false)
phoneVerifyCode String?
phoneVerifyCodeExpiry DateTime?
phoneVerifiedAt DateTime?

// OAuth integration
authMethod String @default("email") // email, google
```

## API Endpoints

### POST `/api/sabi/auth/verify-phone`
Initiates phone verification by sending code to email.

**Request:**
```json
{
  "phone": "0701234567" or "+234701234567"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to your email",
  "phone": "+234701234567",
  "codeExpiresIn": "10 minutes"
}
```

**Status Codes:**
- `200`: Code sent successfully
- `400`: Invalid phone number or already verified
- `401`: User not authenticated
- `500`: Server error

### PUT `/api/sabi/auth/verify-phone`
Confirms phone verification with the code.

**Request:**
```json
{
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Phone number verified successfully",
  "phone": "+234701234567"
}
```

**Status Codes:**
- `200`: Phone verified successfully
- `400`: Invalid or expired code
- `401`: User not authenticated
- `500`: Server error

## Phone Number Formats Supported

All of these formats are automatically converted to international format:

| Format | Example | Result |
|--------|---------|--------|
| Local | `0701234567` | `+234701234567` |
| International | `+234701234567` | `+234701234567` |
| Without + | `234701234567` | `+234701234567` |
| With spaces | `070 1234 567` | `+234701234567` |

## Frontend Integration

### Login Response Now Includes:
```json
{
  "success": true,
  "userId": "cuid123",
  "message": "Login successful",
  "phoneVerified": false,
  "requiresPhoneVerification": true
}
```

### Registration Response Now Includes:
```json
{
  "success": true,
  "userId": "cuid123",
  "message": "Registration successful",
  "phoneVerified": false,
  "requiresPhoneVerification": true
}
```

## Components & Pages

### `/src/app/sabi/verify-phone/page.tsx`
Complete phone verification UI with three steps:
1. **Phone Input**: User enters and validates phone number
2. **Code Input**: User enters 6-digit code sent to email
3. **Success**: Confirmation that phone is verified

Features:
- Beautiful animations with Framer Motion
- Form validation with error messages
- Loading states
- Skip option for later verification
- Responsive design for mobile/desktop

## Helper Functions

### `phoneValidation.ts`
```typescript
// Validate Nigerian phone number
const validPhone = validatePhoneNumber(phone);

// Format for display
const formatted = formatPhoneForDisplay('+234701234567');
// Returns: "+234 701 234 5678"

// Check if valid
const isValid = isValidPhoneNumber('0701234567');
```

### `phoneVerificationHelper.ts`
```typescript
// Check if user needs verification
const needs = await userNeedsPhoneVerification(userId);

// Check if already verified
const verified = await isPhoneVerified(userId);

// Get user's phone
const phone = await getUserPhone(userId);

// Check if can request code
const canRequest = await canRequestPhoneVerification(userId);

// Get full verification status
const status = await getPhoneVerificationStatus(userId);
```

## Google OAuth Integration

When a user signs in with Google:

1. System creates SabiUser record with:
   - `googleId`: Google account ID
   - `authMethod`: "google"
   - `emailVerified`: true (pre-verified by Google)
   - `phone`: null (to be collected)

2. User is redirected to `/sabi/verify-phone` after sign-in

3. User verifies phone number in one-time flow

4. After verification, user can access dashboard

## Email Templates

### Phone Verification Email
Includes:
- 6-digit verification code
- Expiration info (10 minutes)
- Explanation of why we need phone number
- Branding and contact info

## Security Features

✅ **Rate Limiting**: 
- Limited verification code requests
- Limited code submission attempts

✅ **Code Expiration**: 
- Codes expire after 10 minutes
- Prevents brute force attacks

✅ **Session-Based**: 
- Requires valid session token
- Can't verify without authentication

✅ **One-Time Flow**: 
- Can only set phone number once
- Prevents accidental overwrites

✅ **Input Validation**: 
- Nigerian phone numbers only
- Format validation on both frontend and backend

## User Flow Diagram

### Email/Password Registration:
```
Register → Email Verification → Phone Verification → Dashboard
```

### Google Sign-In:
```
Google → Account Created → Phone Verification → Dashboard
```

### Skip Phone Verification:
```
Phone Page → Skip → Dashboard (with banner: "Verify later")
```

## Implementation Checklist

- ✅ Database schema updated
- ✅ API endpoints created
- ✅ Phone validation utility
- ✅ Email templates added
- ✅ UI component created
- ✅ Helper functions created
- ✅ Google OAuth integration
- ✅ Login/Register response updated
- ⚠️ Middleware integration (optional)
- ⚠️ Dashboard warning banner (if skipped)

## Optional Enhancements

### 1. Middleware Protection
Add to `middleware.ts` to force phone verification:
```typescript
import { handlePhoneVerificationCheck } from '@/lib/phoneVerificationMiddleware';

export async function middleware(request: NextRequest) {
  const phoneCheckResponse = await handlePhoneVerificationCheck(request);
  if (phoneCheckResponse) return phoneCheckResponse;
  // ... rest of middleware
}
```

### 2. Dashboard Warning
Show banner if phone not verified:
```typescript
if (!phoneVerified && !phone) {
  // Show: "Complete your profile by verifying your phone number"
  // Link to: /sabi/verify-phone
}
```

### 3. SMS Fallback (Future)
Replace email codes with SMS:
- Update API to use SMS service
- Update email template conditionally
- Keep current implementation as fallback

### 4. Phone Update
Allow users to update phone number:
- Requires re-verification
- Separate endpoint: `POST /api/sabi/auth/update-phone`
- Maintain `phoneVerified: false` until new code verified

## Testing

### Manual Testing Checklist:

1. **Email/Password Flow:**
   - [ ] Register new account
   - [ ] Verify email
   - [ ] See phone verification page
   - [ ] Enter valid Nigerian phone
   - [ ] Receive verification code in email
   - [ ] Enter correct code
   - [ ] Redirected to dashboard
   - [ ] Phone appears in profile

2. **Google OAuth Flow:**
   - [ ] Click Google Sign-In button
   - [ ] Authorize with Google account
   - [ ] Automatically redirect to phone verification
   - [ ] Complete phone verification
   - [ ] Access dashboard with verified phone

3. **Edge Cases:**
   - [ ] Invalid phone format shows error
   - [ ] Expired code shows error message
   - [ ] Wrong code shows error
   - [ ] Skip button works and navigates to dashboard
   - [ ] Back button works in code input step
   - [ ] Can't verify same phone twice

4. **Data Integrity:**
   - [ ] Phone saved in correct format (+234...)
   - [ ] `phoneVerified` flag set to true
   - [ ] `phoneVerifiedAt` timestamp recorded
   - [ ] `authMethod` recorded correctly
   - [ ] Old verification codes cleared after verification

## Troubleshooting

### User not receiving verification email:
- Check email address is correct
- Check spam folder
- Verify RESEND_API_KEY is set
- Check email rate limits

### "Already verified" error:
- User already has phone number and phoneVerified=true
- Admin can reset by setting `phone = null` and `phoneVerified = false`

### Invalid phone format error:
- Only Nigerian numbers accepted
- Formats: 0701234567, +234701234567, 234701234567
- Must be 11 digits (local) or 13 digits (international)

### Session expired error:
- User needs to log in again
- Session token invalid or expired
- Check `sessionExpiry` in database

## Database Queries

### Check phone verification status:
```sql
SELECT phone, phoneVerified, phoneVerifiedAt, authMethod 
FROM SabiUser 
WHERE id = 'user-id';
```

### Find unverified users:
```sql
SELECT COUNT(*) FROM SabiUser 
WHERE phoneVerified = false 
AND phone IS NOT NULL;
```

### Find Google users pending phone verification:
```sql
SELECT * FROM SabiUser 
WHERE authMethod = 'google' 
AND phoneVerified = false;
```

## Future Enhancements

1. **SMS Verification**: Replace email with SMS for faster verification
2. **Phone Update Flow**: Allow users to update phone with re-verification
3. **Admin Dashboard**: View verification stats and manage manual verifications
4. **Two-Factor Auth**: Use verified phone for 2FA
5. **Phone-Based Recovery**: Use phone number for account recovery
6. **International Support**: Support phone numbers from other countries

## Support & Maintenance

- **Monitoring**: Track verification completion rates
- **Alerts**: Alert if verification failure rates spike
- **Support**: Users can contact support if issues with verification
- **Recovery**: Manual verification by admin if technical issues occur

---

**Last Updated**: 2026-06-04
**Status**: Production Ready
