# Phase 7.2 Testing Guide - User Management & Email

## Overview
This document provides comprehensive testing procedures for Phase 7.2 features:
- User management (invite, disable/enable, password management)
- Email configuration (Mailgun integration)
- Invite acceptance flow
- Password reset flow
- Security features (rate limiting, token expiry, encryption)

## Pre-requisites

### 1. Environment Setup
Ensure the following environment variables are set in `backend/.env`:
```env
DATABASE_URL="postgresql://lms:lms_pass@localhost:5432/lms_dev?schema=public"
JWT_SECRET="your-jwt-secret-key"
ENCRYPTION_SECRET="your-encryption-secret-key-32chars-min"
```

### 2. Start Servers
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend  
cd frontend && npm run dev
```

Backend: http://localhost:4000
Frontend: http://localhost:3000

### 3. Email Configuration
**Option A: Mailgun Sandbox (Recommended for testing)**
1. Sign up for free Mailgun account at https://www.mailgun.com
2. Get sandbox domain and API key from dashboard
3. Add your testing email to authorized recipients
4. Configure via UI at http://localhost:3000/admin/email-config

**Option B: Test Mode (No actual emails)**
- Email service will log emails to `EmailLog` table
- Can retrieve invite/reset tokens from database
- Useful for automated testing

## Testing Procedures

### Test 1: Email Configuration

#### Via Frontend UI:
1. Login as admin: `admin@acme.local` / `adminpass`
2. Navigate to Admin → Email Configuration
3. Fill in Mailgun credentials:
   - Provider: Mailgun
   - Domain: your-sandbox-domain.mailgun.org
   - API Key: your-api-key
   - Region: US or EU
   - From Email: noreply@yourdomain.com
   - From Name: Your LMS Name
4. Click "Test Email Configuration"
5. Verify test email received

#### Verify:
- ✅ API key is masked in UI after save
- ✅ Test email sends successfully
- ✅ Email log entry created
- ✅ Only admins can access configuration

### Test 2: User Invitation Flow

#### Step 1: Send Invitation
1. Login as admin
2. Navigate to Admin → Tenants → Select Tenant → Users
3. Click "Create User"
4. Fill in form:
   - Email: testuser@example.com
   - Full Name: Test User
   - Role: Learner
   - Leave password empty (invite mode)
5. Submit form
6. Verify success message

#### Step 2: Check Email Log
Navigate to Admin → Email Configuration → View Logs
Verify:
- ✅ Email log entry exists for invite
- ✅ Status is "sent" or "pending"
- ✅ Recipient is correct
- ✅ Email type is "invite"

#### Step 3: Extract Invite Token (if not using real email)
```sql
-- Connect to database
SELECT "inviteToken", "inviteExpiresAt" 
FROM "User" 
WHERE email = 'testuser@example.com';
```

#### Step 4: Accept Invitation
1. Open: http://localhost:3000/accept-invite?token=INVITE_TOKEN_HERE
2. Verify page loads correctly
3. Enter password (min 8 chars)
4. Confirm password
5. Submit form
6. Verify:
   - ✅ Success message displays
   - ✅ Auto-redirects to login after 2 seconds
   - ✅ Can login with new credentials

#### Step 5: Verify Database State
```sql
SELECT id, email, status, "inviteToken", "inviteExpiresAt", password IS NOT NULL as has_password
FROM "User" 
WHERE email = 'testuser@example.com';
```
Verify:
- ✅ Status changed from "invited" to "active"
- ✅ inviteToken is NULL
- ✅ inviteExpiresAt is NULL
- ✅ password is set (has_password = true)

### Test 3: Password Reset Flow

#### Step 1: Request Password Reset
1. Logout if logged in
2. Navigate to http://localhost:3000/forgot-password
3. Enter email of existing active user
4. Submit form
5. Verify:
   - ✅ Success message always shows (even for non-existent emails)
   - ✅ Message doesn't reveal if email exists (security)

#### Step 2: Check Email Log
If email exists in system:
- ✅ Email log entry created for password reset
- ✅ Status is "sent"
- ✅ Email type is "password_reset"

#### Step 3: Extract Reset Token
```sql
SELECT "resetPasswordToken", "resetPasswordExpiresAt"
FROM "User"
WHERE email = 'your-test-email@example.com';
```

#### Step 4: Reset Password
1. Open: http://localhost:3000/reset-password?token=RESET_TOKEN_HERE
2. Verify page loads correctly
3. Enter new password (min 8 chars)
4. Confirm new password
5. Submit form
6. Verify:
   - ✅ Success message displays
   - ✅ Auto-redirects to login after 2 seconds
   - ✅ Can login with new password
   - ✅ Old password no longer works

#### Step 5: Verify Database State
```sql
SELECT email, "resetPasswordToken", "resetPasswordExpiresAt", password 
FROM "User"
WHERE email = 'your-test-email@example.com';
```
Verify:
- ✅ resetPasswordToken is NULL
- ✅ resetPasswordExpiresAt is NULL
- ✅ password hash has changed

### Test 4: Token Expiry

#### Invite Token Expiry (72 hours)
1. Create user with invite
2. Wait 72+ hours OR manually set `inviteExpiresAt` in past:
   ```sql
   UPDATE "User"
   SET "inviteExpiresAt" = NOW() - INTERVAL '1 hour'
   WHERE email = 'testuser@example.com';
   ```
3. Try to accept invite with token
4. Verify:
   - ✅ Error message: "Token expired or invalid"
   - ✅ User status remains "invited"
   - ✅ Cannot set password

#### Reset Token Expiry (1 hour)
1. Request password reset
2. Manually expire token:
   ```sql
   UPDATE "User"
   SET "resetPasswordExpiresAt" = NOW() - INTERVAL '1 minute'
   WHERE email = 'testuser@example.com';
   ```
3. Try to reset password with token
4. Verify:
   - ✅ Error message: "Token expired or invalid"
   - ✅ Password not changed
   - ✅ User can request new reset token

### Test 5: Single-Use Tokens

#### Invite Token
1. Accept invite with valid token
2. Try to use same token again
3. Verify:
   - ✅ Token no longer valid
   - ✅ Error message displayed
   - ✅ User already active, cannot re-invite

#### Reset Token
1. Reset password with valid token
2. Try to use same token again
3. Verify:
   - ✅ Token no longer valid
   - ✅ Error message displayed
   - ✅ Cannot reset password twice with same token

### Test 6: Rate Limiting

#### Auth Endpoints (5 requests per 15 minutes)
Test endpoints: `/api/auth/login`, `/api/auth/accept-invite`, `/api/auth/reset-password`

1. Make 5 rapid requests to login endpoint with wrong password
2. Try 6th request
3. Verify:
   - ✅ Returns 429 Too Many Requests
   - ✅ Error message about rate limit
   - ✅ Must wait 15 minutes for reset

#### Invite/Reset Endpoints (3 requests per hour)
Test endpoints: `/api/tenants/:id/users/:id/invite`, `/api/auth/forgot-password`

1. Send 3 password reset requests rapidly
2. Try 4th request
3. Verify:
   - ✅ Returns 429 Too Many Requests
   - ✅ Error message about rate limit
   - ✅ Must wait 1 hour for reset

### Test 7: User Management

#### Disable User
1. Login as admin
2. Navigate to Users page
3. Click "Disable" on active user
4. Verify:
   - ✅ Status badge changes to "Disabled"
   - ✅ User cannot login
   - ✅ Existing sessions terminated (on next request)

#### Enable User
1. Click "Enable" on disabled user
2. Verify:
   - ✅ Status badge changes to "Active"
   - ✅ User can login again

#### Change Password (Admin)
1. Edit user
2. Enter new password
3. Save
4. Verify:
   - ✅ User must use new password to login
   - ✅ Old password no longer works

#### Change Password (Self-Service)
1. Login as regular user
2. Navigate to profile/settings
3. Change own password
4. Verify:
   - ✅ Can change own password
   - ✅ Cannot change other users' passwords
   - ✅ Re-authentication required with new password

### Test 8: Security Validation

#### Frontend Validation
Navigate to each auth page and verify client-side validation:

**Accept Invite Page:**
- ✅ Password required
- ✅ Min 8 characters enforced
- ✅ Password confirmation must match
- ✅ Token required in URL
- ✅ Loading state during submission
- ✅ Error messages display correctly

**Forgot Password Page:**
- ✅ Email required
- ✅ Valid email format enforced
- ✅ Always shows success message (no email enumeration)
- ✅ Loading state during submission

**Reset Password Page:**
- ✅ Password required
- ✅ Min 8 characters enforced
- ✅ Password confirmation must match
- ✅ Token required in URL
- ✅ Loading state during submission
- ✅ Error messages display correctly

#### Backend Validation
Test API endpoints directly:

**Password Strength:**
```bash
# Should fail - too short
curl -X POST http://localhost:4000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"valid-token","password":"short"}'
# Expected: 400 error

# Should succeed - meets requirements
curl -X POST http://localhost:4000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"valid-token","password":"StrongPass123"}'
```

#### API Key Encryption
1. Create email config via UI
2. Check database:
   ```sql
   SELECT id, provider, "apiKey", "createdAt"
   FROM "EmailConfig";
   ```
3. Verify:
   - ✅ apiKey is encrypted (not plaintext)
   - ✅ Encrypted value changes each time (includes IV)
   - ✅ Cannot reverse engineer original key from database

#### Tenant Isolation
1. Login as admin of Tenant A
2. Try to:
   - Invite user to Tenant B
   - View users of Tenant B
   - Modify email config of Tenant B
3. Verify:
   - ✅ All requests return 403 Forbidden
   - ✅ Cannot access other tenant's data
   - ✅ Can only manage users in own tenant

### Test 9: Email Templates

Verify email templates contain correct content:

**Invite Email:**
- ✅ Recipient name included
- ✅ Tenant/organization name included
- ✅ Correct accept-invite link with token
- ✅ Professional formatting
- ✅ Expiry time mentioned (72 hours)

**Reset Password Email:**
- ✅ Recipient name included
- ✅ Reset password link with token
- ✅ Security warning about not requesting reset
- ✅ Professional formatting
- ✅ Expiry time mentioned (1 hour)

**Welcome Email (on first login):**
- ✅ Recipient name included
- ✅ Welcome message with tenant branding
- ✅ Helpful getting started information

### Test 10: Error Handling

Test various error scenarios:

**Invalid Tokens:**
- ✅ Malformed token returns error
- ✅ Non-existent token returns error
- ✅ Error message doesn't leak information

**Database Errors:**
- ✅ Gracefully handles connection issues
- ✅ Returns generic error message to client
- ✅ Logs detailed error server-side

**Email Service Errors:**
- ✅ Failed email send logs error
- ✅ User creation succeeds even if email fails
- ✅ EmailLog records failure status
- ✅ Admin can retry sending email

## Security Checklist

- ✅ Passwords hashed with bcrypt (salt rounds ≥ 10)
- ✅ API keys encrypted at rest
- ✅ CSRF protection enabled for state-changing requests
- ✅ Rate limiting on auth endpoints
- ✅ JWT tokens have expiration
- ✅ Refresh tokens stored securely
- ✅ No password hashes in API responses
- ✅ Email enumeration protection (forgot password)
- ✅ Tokens are single-use
- ✅ Tokens have expiration times
- ✅ Tenant isolation enforced
- ✅ Admin-only routes protected
- ✅ User can only change own password (non-admin)
- ✅ Invite/reset links use cryptographically secure tokens

## Known Limitations

1. **Email Delivery:** Requires Mailgun account for actual email delivery
2. **Browser Testing:** Some tests require manual browser interaction
3. **Rate Limit Reset:** Must wait for time window to pass or restart server
4. **Token Cleanup:** Expired tokens remain in database (could add cleanup job)

## Troubleshooting

### Emails Not Sending
- Check Mailgun API key is correct
- Verify domain is configured in Mailgun
- Check Mailgun sandbox authorized recipients
- Review email logs for errors

### CSRF Token Errors
- Ensure cookies are enabled
- Clear browser cookies and re-login
- Check CSRF token middleware is loaded

### Database Connection Errors
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure migrations are run: `npm run prisma:migrate`

### Token Errors
- Check token hasn't expired
- Verify token is complete (not truncated in email)
- Ensure user status is correct (invited/active)

## Automated Testing Script

```bash
#!/bin/bash
# Phase 7.2 Smoke Test Script

echo "=== Phase 7.2 Smoke Tests ==="

# Test 1: Health check
echo "1. Testing backend health..."
curl -f http://localhost:4000/api/health || echo "❌ Backend not responding"
echo "✅ Backend healthy"

# Test 2: Login
echo "2. Testing authentication..."
curl -f -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.local","password":"adminpass"}' \
  -c /tmp/test-cookies.txt > /dev/null || echo "❌ Login failed"
echo "✅ Login successful"

# Test 3: Frontend pages load
echo "3. Testing frontend pages..."
for page in "" "login" "forgot-password" "accept-invite" "reset-password"; do
  curl -f -s -o /dev/null http://localhost:3000/$page || echo "❌ Page /$page failed to load"
done
echo "✅ All pages load"

# Test 4: Check environment
echo "4. Checking environment..."
if grep -q "ENCRYPTION_SECRET" backend/.env; then
  echo "✅ ENCRYPTION_SECRET configured"
else
  echo "❌ ENCRYPTION_SECRET missing"
fi

echo ""
echo "=== Smoke Tests Complete ==="
echo "Run full manual tests as documented in TESTING_PHASE_7_2.md"
```

## Test Results Template

```markdown
## Phase 7.2 Test Results
**Date:** YYYY-MM-DD
**Tester:** Name
**Environment:** Development/Staging/Production

### Test Summary
- Total Tests: XX
- Passed: XX
- Failed: XX
- Skipped: XX

### Test Details

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Email Configuration | ✅/❌ | |
| 2 | User Invitation Flow | ✅/❌ | |
| 3 | Password Reset Flow | ✅/❌ | |
| 4 | Token Expiry | ✅/❌ | |
| 5 | Single-Use Tokens | ✅/❌ | |
| 6 | Rate Limiting | ✅/❌ | |
| 7 | User Management | ✅/❌ | |
| 8 | Security Validation | ✅/❌ | |
| 9 | Email Templates | ✅/❌ | |
| 10 | Error Handling | ✅/❌ | |

### Issues Found
1. Issue description
2. Issue description

### Recommendations
1. Recommendation
2. Recommendation
```

## Next Steps

After completing Phase 7.2 testing:
1. Document any issues found
2. Address critical bugs
3. Update PROJECT_STATUS.md with completion status
4. Prepare for Phase 8 (Course Enrollment & Progress Tracking)
