# Stripe Setup Guide for PeerCV

Complete step-by-step guide to set up Stripe payments in your PeerCV application.

## 📋 Prerequisites

- Stripe account (sign up at https://stripe.com)
- Access to your Supabase project
- Your Next.js app running locally or deployed

## 🚀 Step-by-Step Setup

### Step 1: Create Stripe Account & Get API Keys

1. **Sign up/Login to Stripe Dashboard**
   - Go to https://dashboard.stripe.com
   - Complete account setup if new

2. **Get Your API Keys**
   - Go to **Developers** → **API keys**
   - Copy your **Publishable key** (starts with `pk_test_...` or `pk_live_...`)
   - Copy your **Secret key** (starts with `sk_test_...` or `sk_live_...`)
   - ⚠️ **Important**: Use test keys for development, live keys for production

3. **Add to Environment Variables**
   Create or update `.env.local`:
   ```env
   STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   ```

### Step 2: Create Products in Stripe Dashboard

You need to create products matching your pricing tiers. For each product:

1. **Go to Products** → **Add product**

2. **Create User Products:**

   **PeerCV Pro:**
   - Name: `PeerCV Pro`
   - Description: `AI-enhanced résumé tools and extended coworker requests`
   - Pricing:
     - Monthly: $8.99/month (recurring)
     - Yearly: $84.00/year (recurring)
   - Copy the **Price IDs** (starts with `price_...`)

   **PeerCV Elite:**
   - Name: `PeerCV Elite`
   - Description: `Full verification + unlimited coworker requests + premium features`
   - Pricing:
     - Monthly: $19.99/month (recurring)
     - Yearly: $198.00/year (recurring)
   - Copy the **Price IDs**

3. **Create Employer Products:**

   **Employer Lite:**
   - Name: `Employer Lite`
   - Description: `20 profile lookups/month with full access to verified work history`
   - Pricing: $49.00/month (recurring)
   - Copy the **Price ID**

   **Employer Pro:**
   - Name: `Employer Pro`
   - Description: `100 monthly lookups, priority matching, ATS integrations`
   - Pricing: $149.00/month (recurring)
   - Copy the **Price ID**

   **Employer Enterprise:**
   - Name: `Employer Enterprise`
   - Description: `Unlimited lookups, custom API access, turnover insights`
   - Pricing: $499.00/month (recurring)
   - Copy the **Price ID**

4. **Create Pay-Per-Lookup:**
   - Name: `Pay-Per-Lookup`
   - Description: `Single candidate profile lookup`
   - Pricing: $7.99 (one-time payment)
   - Copy the **Price ID**

### Step 3: Store Price IDs in Your App

You have two options:

**Option A: Store in Environment Variables (Recommended)**

Add to `.env.local`:
```env
# Stripe Price IDs
STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
STRIPE_PRICE_PRO_YEARLY=price_xxxxx
STRIPE_PRICE_ELITE_MONTHLY=price_xxxxx
STRIPE_PRICE_ELITE_YEARLY=price_xxxxx
STRIPE_PRICE_EMP_LITE=price_xxxxx
STRIPE_PRICE_EMP_PRO=price_xxxxx
STRIPE_PRICE_EMP_ENTERPRISE=price_xxxxx
STRIPE_PRICE_LOOKUP=price_xxxxx
```

**Option B: Update `lib/stripe/products.ts`**

Add a `stripePriceId` field to each price object, or create a mapping function.

### Step 4: Set Up Webhook Endpoint

1. **Go to Stripe Dashboard** → **Developers** → **Webhooks**

2. **Add Endpoint:**
   - **Endpoint URL**: 
     - Local: Use Stripe CLI (see below)
     - Production: `https://your-domain.com/api/stripe/webhook`
   - **Description**: `PeerCV webhook handler`

3. **Select Events to Listen To:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.payment_failed`

4. **Copy Webhook Signing Secret:**
   - After creating endpoint, click on it
   - Copy the **Signing secret** (starts with `whsec_...`)
   - Add to `.env.local`:
     ```env
     STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
     ```

### Step 5: Test Webhook Locally (Development)

For local development, use Stripe CLI:

1. **Install Stripe CLI:**
   ```bash
   # Windows (using Scoop)
   scoop install stripe

   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe:**
   ```bash
   stripe login
   ```

3. **Forward Webhooks to Local Server:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Copy the Webhook Secret:**
   - The CLI will show a webhook secret like `whsec_...`
   - Use this in your `.env.local` for local testing:
     ```env
     STRIPE_WEBHOOK_SECRET=whsec_xxx_from_cli
     ```

### Step 6: Update Environment Variables

Complete `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_URL=http://localhost:3000  # or your production URL

# Optional: Individual Price IDs (if using env vars)
STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
STRIPE_PRICE_PRO_YEARLY=price_xxxxx
STRIPE_PRICE_ELITE_MONTHLY=price_xxxxx
STRIPE_PRICE_ELITE_YEARLY=price_xxxxx
STRIPE_PRICE_EMP_LITE=price_xxxxx
STRIPE_PRICE_EMP_PRO=price_xxxxx
STRIPE_PRICE_EMP_ENTERPRISE=price_xxxxx
STRIPE_PRICE_LOOKUP=price_xxxxx
```

### Step 7: Update Pricing Component with Price IDs

Update `components/pricing-section.tsx` to use actual Price IDs:

```typescript
// Replace 'price_placeholder' with actual Price IDs
const PRICE_IDS = {
  proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_xxxxx',
  proYearly: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_xxxxx',
  eliteMonthly: process.env.STRIPE_PRICE_ELITE_MONTHLY || 'price_xxxxx',
  eliteYearly: process.env.STRIPE_PRICE_ELITE_YEARLY || 'price_xxxxx',
  empLite: process.env.STRIPE_PRICE_EMP_LITE || 'price_xxxxx',
  empPro: process.env.STRIPE_PRICE_EMP_PRO || 'price_xxxxx',
  empEnterprise: process.env.STRIPE_PRICE_EMP_ENTERPRISE || 'price_xxxxx',
  lookup: process.env.STRIPE_PRICE_LOOKUP || 'price_xxxxx',
}
```

### Step 8: Test the Integration

1. **Start Your App:**
   ```bash
   npm run dev
   ```

2. **Test Checkout:**
   - Go to `/pricing`
   - Click "Subscribe" on any plan
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date (e.g., 12/34)
   - Any CVC (e.g., 123)
   - Any ZIP code

3. **Verify Webhook:**
   - Check Stripe Dashboard → **Events** for webhook deliveries
   - Check your database for subscription records
   - Check browser console for any errors

### Step 9: Production Setup

When ready for production:

1. **Switch to Live Mode:**
   - In Stripe Dashboard, toggle to **Live mode**
   - Copy **Live API keys** (starts with `pk_live_` and `sk_live_`)
   - Update `.env.local` or production environment variables

2. **Update Webhook Endpoint:**
   - Create new webhook endpoint with your production URL
   - Copy the new webhook secret
   - Update environment variables

3. **Test with Real Cards:**
   - Use Stripe's test cards in test mode first
   - Then test with real cards in live mode (small amounts)

## 🔑 Required Environment Variables Summary

```env
# Required
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_URL=http://localhost:3000 or https://your-domain.com

# Optional (if storing Price IDs in env)
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_ELITE_MONTHLY=price_...
STRIPE_PRICE_ELITE_YEARLY=price_...
STRIPE_PRICE_EMP_LITE=price_...
STRIPE_PRICE_EMP_PRO=price_...
STRIPE_PRICE_EMP_ENTERPRISE=price_...
STRIPE_PRICE_LOOKUP=price_...
```

## 🧪 Test Cards

Use these test cards in Stripe test mode:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Auth**: `4000 0025 0000 3155`
- **3D Secure**: `4000 0027 6000 3184`

## ✅ Checklist

- [ ] Stripe account created
- [ ] API keys copied to `.env.local`
- [ ] All products created in Stripe Dashboard
- [ ] All Price IDs copied
- [ ] Webhook endpoint created
- [ ] Webhook secret added to `.env.local`
- [ ] Stripe CLI installed (for local testing)
- [ ] Pricing component updated with Price IDs
- [ ] Test checkout completed successfully
- [ ] Webhook events received in Stripe Dashboard
- [ ] Subscription records created in database

## 🐛 Troubleshooting

**Webhook not receiving events:**
- Check webhook URL is correct
- Verify webhook secret matches
- Check Stripe Dashboard → Events for delivery status
- Ensure your server is accessible (use Stripe CLI for local)

**Checkout not working:**
- Verify `STRIPE_SECRET_KEY` is set
- Check Price IDs are correct
- Verify user is authenticated
- Check browser console for errors

**Subscription not created:**
- Check webhook is receiving `checkout.session.completed`
- Verify webhook handler is updating database
- Check Supabase logs for errors
- Ensure `stripe_customer_id` is set in profiles table

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Next.js + Stripe](https://stripe.com/docs/payments/checkout)
