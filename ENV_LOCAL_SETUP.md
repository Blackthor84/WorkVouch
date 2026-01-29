# .env.local Setup Guide

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Fill in your actual values** (see sections below)

3. **Restart your dev server:**
   ```bash
   npm run dev
   ```

---

## Required Variables

### Supabase (3 variables)
Get these from: https://supabase.com/dashboard → Your Project → Settings → API

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### NextAuth (2 variables)
```env
NEXTAUTH_URL=http://localhost:3000  # or https://tryworkvouch.com for production
NEXTAUTH_SECRET=your-secret-here   # Generate with: openssl rand -base64 32
```

### Stripe Keys (3 variables)
Get these from: https://dashboard.stripe.com/apikeys

```env
STRIPE_SECRET_KEY=sk_test_...      # Use sk_live_... for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Use pk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...    # Get from Stripe Dashboard → Webhooks
```

### Stripe Price IDs (5 variables - REQUIRED)
Get these from: Stripe Dashboard → Products → [Product] → Pricing

**Canonical Names (use these exact names):**
```env
STRIPE_PRICE_STARTER=price_xxxxx   # $49/month
STRIPE_PRICE_TEAM=price_xxxxx      # $149/month
STRIPE_PRICE_PRO=price_xxxxx       # $299/month
STRIPE_PRICE_SECURITY=price_xxxxx  # $199/month
STRIPE_PRICE_ONE_TIME=price_xxxxx  # $14.99 one-time
```

**⚠️ IMPORTANT:** Do NOT use old variable names:
- ❌ `STRIPE_PRICE_BASIC` (use `STRIPE_PRICE_STARTER`)
- ❌ `STRIPE_PRICE_SECURITY_BUNDLE` (use `STRIPE_PRICE_SECURITY`)
- ❌ `STRIPE_PRICE_PAY_PER_USE` (use `STRIPE_PRICE_ONE_TIME`)
- ❌ `STRIPE_PRICE_ENTERPRISE` (removed)
- ❌ `STRIPE_PRICE_WORKER_FREE` (not needed)

---

## Optional Variables

### Google OAuth (only if using Google sign-in)
```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### SendGrid (only if sending emails)
```env
SENDGRID_API_KEY=SG...
SENDGRID_SENDER_EMAIL=your-verified-email@example.com
```

### OpenAI (only if using AI features)
```env
OPENAI_API_KEY=sk-...
```

---

## Verification

After setting up `.env.local`, restart your dev server and check the console output:

```
=== WorkVouch Environment Variables Debug ===
NEXTAUTH_URL: http://localhost:3000
STRIPE_SECRET_KEY: ✅ SET
STRIPE_PRICE_STARTER: price_xxxxx
STRIPE_PRICE_TEAM: price_xxxxx
STRIPE_PRICE_PRO: price_xxxxx
STRIPE_PRICE_SECURITY: price_xxxxx
STRIPE_PRICE_ONE_TIME: price_xxxxx
=============================================
```

If any variable shows `❌ MISSING`, add it to `.env.local` and restart.

---

## Security Notes

- ✅ `.env.local` is already in `.gitignore` - it won't be committed
- ❌ Never commit `.env.local` to git
- ✅ Use test keys for development
- ✅ Use live keys only in production (Vercel environment variables)
- ⚠️ Keep `SUPABASE_SERVICE_ROLE_KEY` secret - it has admin access

---

## Production (Vercel)

Set all these variables in Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Add each variable for **Production**, **Preview**, and **Development**
3. Use live Stripe keys for Production, test keys for Preview/Development

---

## Troubleshooting

### "Price ID not configured" error
- Check that all 5 Price ID variables are set
- Verify Price IDs exist in Stripe Dashboard
- Ensure Price IDs are active (not archived)

### NextAuth redirect issues
- Verify `NEXTAUTH_URL` matches your domain
- Check `NEXTAUTH_SECRET` is set and valid

### Logo 404 errors
- Ensure `workvouch-logo.png` exists at `/public/workvouch-logo.png`

### Stripe checkout fails
- Verify `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` match (both test or both live)
- Check webhook secret is correct
