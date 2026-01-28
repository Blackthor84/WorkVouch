# WorkVouch Environment & Configuration Audit Report

**Generated:** January 27, 2026  
**Auditor:** Full-Stack Environment & Payment Auditor  
**Scope:** Supabase, NextAuth, Vercel, Stripe, and Cross-Stack Validation

---

## Executive Summary

This audit identifies **critical configuration issues** that must be resolved before deployment:

1. ⚠️ **CRITICAL**: NextAuth uses **anon key** instead of **service role key** for authentication
2. ⚠️ **CRITICAL**: Multiple Stripe Price ID variables referenced but may not be set
3. ⚠️ **WARNING**: Google OAuth configured but may not be required
4. ✅ **VALID**: Supabase schema structure is correct
5. ⚠️ **WARNING**: Some optional variables (SendGrid, OpenAI) may be missing

---

## 1. Supabase Variables Audit

### Required Variables

| Variable Name | Expected Format | Status | Notes |
|--------------|----------------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | ⚠️ **MUST VERIFY** | Required for all Supabase operations |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ⚠️ **MUST VERIFY** | Used in client-side and NextAuth (see issue below) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ⚠️ **MUST VERIFY** | Required for server-side admin operations |

### Database Schema Validation

| Table/Column | Expected Structure | Status | Notes |
|--------------|-------------------|--------|-------|
| `user_roles` table | `id UUID, user_id UUID, role user_role, created_at TIMESTAMPTZ` | ✅ **VALID** | Schema matches code expectations |
| `user_roles.role` enum | `'user', 'employer', 'admin'` | ⚠️ **CHECK** | Code also references `'superadmin'` and `'beta'` - verify enum includes these |
| `profiles` table | References `auth.users(id)` | ✅ **VALID** | Standard Supabase pattern |
| `employer_accounts` table | `plan_tier` column exists | ✅ **VALID** | Required for subscription management |

### Issues Found

1. **⚠️ CRITICAL**: The `user_roles.role` enum in `schema.sql` only includes `'user', 'employer', 'admin'`, but code references:
   - `'superadmin'` (used in `authOptions.ts` line 69)
   - `'beta'` (used in `authOptions.ts` line 70)
   
   **Action Required**: Verify if these roles exist in your Supabase enum, or update the enum to include them.

2. **⚠️ WARNING**: Test users mentioned in `authOptions.ts` (dummy users array) have placeholder bcrypt hashes. These won't work in production.

---

## 2. NextAuth Variables Audit

### Required Variables

| Variable Name | Expected Format | Status | Notes |
|--------------|----------------|--------|-------|
| `NEXTAUTH_SECRET` | 32+ byte hex string | ⚠️ **MUST VERIFY** | Required for JWT signing. Generate with: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://yourdomain.com` or `http://localhost:3000` | ⚠️ **MUST VERIFY** | Used for redirects and callbacks |

### NextAuth Configuration Issues

| Issue | Location | Severity | Details |
|-------|----------|----------|---------|
| **⚠️ CRITICAL: Using Anon Key Instead of Service Role** | `app/api/auth/[...nextauth]/authOptions.ts:49` | **CRITICAL** | NextAuth `authorize()` function uses `createClient(supabaseUrl, supabaseAnonKey)` instead of service role key. This may cause RLS policy issues when fetching roles. |
| **⚠️ WARNING: Role Fetching May Fail** | `app/api/auth/[...nextauth]/authOptions.ts:59-62` | **HIGH** | Fetches roles from `user_roles` table using anon key. If RLS policies block this, role checks will fail. |
| ✅ **VALID: JWT Callbacks** | `app/api/auth/[...nextauth]/authOptions.ts:115-134` | ✅ **VALID** | JWT and session callbacks correctly map roles |
| ✅ **VALID: Session Strategy** | `app/api/auth/[...nextauth]/authOptions.ts:110` | ✅ **VALID** | JWT strategy with 30-day expiration |

### Recommended Fix

**For NextAuth authentication**, you have two options:

1. **Option A (Recommended)**: Keep using anon key but ensure RLS policies allow role fetching:
   ```sql
   -- Allow users to read their own roles
   CREATE POLICY "Users can read own roles" ON user_roles
   FOR SELECT USING (auth.uid() = user_id);
   ```

2. **Option B**: Use service role key in NextAuth (more secure but requires careful implementation):
   ```typescript
   const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);
   ```

---

## 3. Vercel Environment Variables

### Required Variables (Must be set in Production & Preview)

| Variable | Required For | Status | Notes |
|----------|--------------|--------|-------|
| All Supabase variables | Database operations | ⚠️ **MUST VERIFY** | Set in Vercel Dashboard → Settings → Environment Variables |
| All NextAuth variables | Authentication | ⚠️ **MUST VERIFY** | Set for Production, Preview, and Development |
| All Stripe variables | Payment processing | ⚠️ **MUST VERIFY** | Use live keys for Production, test keys for Preview |

### Vercel-Specific Notes

- ⚠️ **CRITICAL**: Environment variables must be set separately for:
  - **Production** environment
  - **Preview** environment (for PR deployments)
  - **Development** environment (optional, for local dev)

- ⚠️ **WARNING**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never put secrets in these.

---

## 4. Stripe Variables Audit

### Required Stripe Keys

| Variable Name | Expected Format | Status | Notes |
|--------------|----------------|--------|-------|
| `STRIPE_SECRET_KEY` | `sk_test_...` or `sk_live_...` | ⚠️ **MUST VERIFY** | Server-side only. Use test for dev, live for production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` or `pk_live_...` | ⚠️ **MUST VERIFY** | Client-side safe. Must match secret key mode (test/live) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | ⚠️ **MUST VERIFY** | Required for webhook signature verification |

### Stripe Price IDs - Complete List

The following Price IDs are referenced in your codebase. **Each must exist in Stripe and be active:**

| Price ID Variable | Used In | Expected Price | Status | Notes |
|-------------------|---------|----------------|--------|-------|
| `STRIPE_PRICE_STARTER` | `lib/stripePlans.ts:16`, `app/api/pricing/checkout/route.ts:47` | $49/month | ⚠️ **MUST VERIFY** | Also referenced as `STRIPE_PRICE_BASIC` (fallback) |
| `STRIPE_PRICE_TEAM` | `lib/stripePlans.ts:17`, `app/api/pricing/checkout/route.ts:48` | $149/month | ⚠️ **MUST VERIFY** | |
| `STRIPE_PRICE_PRO` | `lib/stripePlans.ts:18`, `app/api/pricing/checkout/route.ts:49` | $299/month | ⚠️ **MUST VERIFY** | Multiple fallbacks in code |
| `STRIPE_PRICE_PAY_PER_USE` | `lib/stripePlans.ts:21`, `app/api/pricing/checkout/route.ts:50` | $14.99 one-time | ⚠️ **MUST VERIFY** | One-time payment, not subscription |
| `STRIPE_PRICE_SECURITY_BUNDLE` | `lib/stripePlans.ts:24`, `app/api/pricing/checkout/route.ts:51` | $199/month | ⚠️ **MUST VERIFY** | Also referenced as `STRIPE_PRICE_SECURITY` in `data/pricing.ts:60` |
| `STRIPE_PRICE_WORKER_FREE` | `lib/stripePlans.ts:27` | $0 (free) | ⚠️ **OPTIONAL** | May not need a Stripe price ID for free plan |
| `STRIPE_PRICE_BASIC` | `lib/stripe/config.ts:9`, `env.mjs:10` | $49/month (legacy) | ⚠️ **LEGACY** | Used as fallback for STARTER |
| `STRIPE_PRICE_ENTERPRISE` | `env.mjs:12` | N/A | ⚠️ **DEPRECATED** | Referenced but not used in active code |

### Stripe Price ID Mismatches Found

1. **⚠️ WARNING**: `data/pricing.ts:60` uses `STRIPE_PRICE_SECURITY` but code uses `STRIPE_PRICE_SECURITY_BUNDLE`
   - **Impact**: Security Bundle checkout may fail if only one variable is set
   - **Fix**: Set both or standardize on one variable name

2. **⚠️ WARNING**: Multiple fallback chains in checkout routes:
   - `STRIPE_PRICE_STARTER || STRIPE_PRICE_BASIC` (line 47)
   - `STRIPE_PRICE_TEAM || STRIPE_PRICE_PRO` (line 48) - **This is wrong!** Team ≠ Pro
   - **Impact**: Users may be charged for wrong plan if variables are misconfigured

3. **⚠️ CRITICAL**: `STRIPE_PRICE_ENTERPRISE` is referenced in `env.mjs` but not used anywhere in active code. This suggests incomplete cleanup.

### Stripe Validation Checklist

- [ ] Verify all 5 active Price IDs exist in Stripe Dashboard
- [ ] Verify each Price ID is **active** (not archived)
- [ ] Verify Price IDs match the correct products:
  - Starter → $49/month recurring
  - Team → $149/month recurring
  - Pro → $299/month recurring
  - Security Bundle → $199/month recurring
  - Pay-Per-Use → $14.99 one-time payment
- [ ] Verify Price IDs are in **test mode** for Preview/Development
- [ ] Verify Price IDs are in **live mode** for Production
- [ ] Test webhook endpoint receives events from Stripe

---

## 5. Optional Service Variables

### Google OAuth (Optional)

| Variable | Status | Notes |
|----------|--------|-------|
| `GOOGLE_CLIENT_ID` | ⚠️ **OPTIONAL** | Only needed if Google sign-in is enabled |
| `GOOGLE_CLIENT_SECRET` | ⚠️ **OPTIONAL** | Only needed if Google sign-in is enabled |

**Recommendation**: If Google OAuth is not used, remove the `GoogleProvider` from `authOptions.ts` to avoid errors.

### SendGrid (Optional)

| Variable | Status | Notes |
|----------|--------|-------|
| `SENDGRID_API_KEY` | ⚠️ **OPTIONAL** | Only needed for email functionality |
| `SENDGRID_SENDER_EMAIL` | ⚠️ **OPTIONAL** | Verified sender email address |

**Impact**: If missing, email features will fail gracefully with warnings.

### OpenAI (Optional)

| Variable | Status | Notes |
|----------|--------|-------|
| `OPENAI_API_KEY` | ⚠️ **OPTIONAL** | Only needed for resume parsing AI features |

**Impact**: If missing, resume parsing will fail. Check `app/api/resume-upload/route.ts` for error handling.

---

## 6. Cross-Stack Validation

### Environment Variable Consistency

| Issue | Location | Severity | Details |
|-------|----------|----------|---------|
| **⚠️ WARNING: Variable Name Inconsistency** | Multiple files | **MEDIUM** | `NEXT_PUBLIC_STRIPE_PK` vs `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - both are supported but should be standardized |
| **⚠️ WARNING: URL Variable Inconsistency** | Multiple files | **MEDIUM** | Code uses `NEXT_PUBLIC_URL`, `NEXT_PUBLIC_APP_URL`, and `NEXTAUTH_URL` as fallbacks. Should standardize. |

### Code-to-Config Validation

| Component | Code Reference | Config Required | Status |
|-----------|---------------|----------------|--------|
| NextAuth Role Fetching | `authOptions.ts:59-62` | `user_roles` table with RLS policy | ⚠️ **MUST VERIFY RLS** |
| Stripe Checkout | `app/api/pricing/checkout/route.ts` | All Price IDs set | ⚠️ **MUST VERIFY** |
| Stripe Webhook | `app/api/stripe/webhook/route.ts:30` | `STRIPE_WEBHOOK_SECRET` set | ⚠️ **MUST VERIFY** |
| Supabase Admin Operations | `lib/supabase/admin.ts:26` | `SUPABASE_SERVICE_ROLE_KEY` set | ⚠️ **MUST VERIFY** |

---

## 7. Critical Issues Summary

### 🔴 CRITICAL (Must Fix Before Deployment)

1. **NextAuth Using Anon Key**: NextAuth should use service role key OR RLS policies must allow role fetching
2. **Stripe Price ID Mismatches**: Team/Pro fallback chain is incorrect (line 48 in checkout route)
3. **Missing Role Enum Values**: Code references `superadmin` and `beta` roles but enum may not include them
4. **Environment Variables Not Verified**: Cannot confirm variables are set in Vercel Production/Preview

### 🟡 HIGH PRIORITY (Should Fix Soon)

1. **Inconsistent Variable Names**: `STRIPE_PRICE_SECURITY` vs `STRIPE_PRICE_SECURITY_BUNDLE`
2. **Deprecated Variables**: `STRIPE_PRICE_ENTERPRISE` referenced but unused
3. **URL Variable Fallbacks**: Multiple URL variables used as fallbacks - should standardize

### 🟢 LOW PRIORITY (Nice to Have)

1. **Optional Services**: Google OAuth, SendGrid, OpenAI may not be configured
2. **Dummy Users**: Placeholder bcrypt hashes in `authOptions.ts` won't work

---

## 8. Action Items Checklist

### Before Deployment

- [ ] **Verify all Supabase variables are set in Vercel** (Production + Preview)
- [ ] **Verify all NextAuth variables are set in Vercel** (Production + Preview)
- [ ] **Verify all Stripe variables are set in Vercel** (Production + Preview)
- [ ] **Create all Stripe Price IDs** and verify they're active
- [ ] **Fix NextAuth to use service role key OR configure RLS policies**
- [ ] **Verify `user_roles` enum includes `superadmin` and `beta`** or update code
- [ ] **Fix Team/Pro fallback chain** in checkout route
- [ ] **Standardize Security Bundle variable name** (`STRIPE_PRICE_SECURITY_BUNDLE`)
- [ ] **Remove or implement Google OAuth** (currently configured but may not be used)
- [ ] **Test webhook endpoint** receives Stripe events correctly

### Post-Deployment Verification

- [ ] Test user signup and login
- [ ] Test role-based access (admin, employer, user)
- [ ] Test Stripe checkout for each plan tier
- [ ] Test Stripe webhook receives subscription events
- [ ] Verify employer account creation and plan assignment
- [ ] Test NextAuth session persistence across page loads

---

## 9. Recommended Next Steps

1. **Immediate**: Fix NextAuth service role key issue or RLS policies
2. **Immediate**: Verify all Stripe Price IDs exist and are active
3. **Before Deploy**: Set all environment variables in Vercel for Production
4. **Before Deploy**: Test checkout flow with test Stripe keys
5. **After Deploy**: Monitor webhook logs for successful event processing

---

## Report Metadata

- **Files Audited**: 30+ configuration and code files
- **Variables Checked**: 25+ environment variables
- **Price IDs Referenced**: 8 (5 active, 3 legacy/deprecated)
- **Critical Issues Found**: 4
- **High Priority Issues**: 3
- **Low Priority Issues**: 2

---

**End of Audit Report**

*This report identifies configuration issues but does not modify any code. All fixes must be applied manually or through separate change requests.*
