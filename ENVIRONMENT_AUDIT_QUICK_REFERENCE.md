# WorkVouch Environment Audit - Quick Reference

## 🔴 CRITICAL ISSUES (Fix Before Deployment)

| Issue | Location | Fix Required |
|-------|----------|--------------|
| **NextAuth uses anon key** | `authOptions.ts:49` | Use service role key OR configure RLS to allow role fetching |
| **Team/Pro price mismatch** | `checkout/route.ts:48` | Fix fallback: `STRIPE_PRICE_TEAM \|\| STRIPE_PRICE_PRO` is wrong |
| **Missing role enum values** | `schema.sql` vs `authOptions.ts` | Add `superadmin` and `beta` to `user_role` enum OR update code |
| **Stripe Price IDs not verified** | All checkout routes | Verify all 5 Price IDs exist and are active in Stripe |

---

## ✅ Required Environment Variables

### Supabase (3 required)
- `NEXT_PUBLIC_SUPABASE_URL` ⚠️ **MUST SET**
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ⚠️ **MUST SET**
- `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **MUST SET**

### NextAuth (2 required)
- `NEXTAUTH_SECRET` ⚠️ **MUST SET** (32+ byte hex string)
- `NEXTAUTH_URL` ⚠️ **MUST SET** (your domain)

### Stripe Keys (3 required)
- `STRIPE_SECRET_KEY` ⚠️ **MUST SET** (`sk_test_...` or `sk_live_...`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` ⚠️ **MUST SET** (`pk_test_...` or `pk_live_...`)
- `STRIPE_WEBHOOK_SECRET` ⚠️ **MUST SET** (`whsec_...`)

### Stripe Price IDs (5 required)
- `STRIPE_PRICE_STARTER` ⚠️ **MUST SET** ($49/month)
- `STRIPE_PRICE_TEAM` ⚠️ **MUST SET** ($149/month)
- `STRIPE_PRICE_PRO` ⚠️ **MUST SET** ($299/month)
- `STRIPE_PRICE_PAY_PER_USE` ⚠️ **MUST SET** ($14.99 one-time)
- `STRIPE_PRICE_SECURITY_BUNDLE` ⚠️ **MUST SET** ($199/month)

---

## ⚠️ Optional Variables

- `GOOGLE_CLIENT_ID` - Only if using Google OAuth
- `GOOGLE_CLIENT_SECRET` - Only if using Google OAuth
- `SENDGRID_API_KEY` - Only if sending emails
- `OPENAI_API_KEY` - Only if using AI features

---

## 📋 Vercel Checklist

Set all required variables in Vercel for:
- [ ] **Production** environment
- [ ] **Preview** environment
- [ ] **Development** environment (optional)

---

## 🔍 Quick Validation Commands

### Check if variables are set (local)
```bash
# Check .env.local exists
cat .env.local | grep -E "SUPABASE|NEXTAUTH|STRIPE" | wc -l
# Should return 13+ lines
```

### Verify Stripe Price IDs (requires Stripe CLI)
```bash
stripe prices list --limit 10
# Verify all 5 Price IDs are in the list
```

### Generate NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

---

## 🎯 Priority Fix Order

1. **Fix NextAuth service role key issue**
2. **Verify all Stripe Price IDs exist**
3. **Set all variables in Vercel**
4. **Fix Team/Pro price fallback**
5. **Standardize Security Bundle variable name**

---

See `ENVIRONMENT_AUDIT_REPORT.md` for full details.
