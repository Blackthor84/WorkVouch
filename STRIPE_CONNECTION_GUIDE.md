# How to Connect Stripe to WorkVouch

This guide will walk you through connecting Stripe payments to your WorkVouch app. The app already has all the code in place - you just need to configure your Stripe account and add the API keys.

## Quick Start (5 Minutes)

### Step 1: Get Your Stripe API Keys

1. **Sign up/Login to Stripe**
   - Go to https://dashboard.stripe.com
   - Create an account or log in

2. **Get Your Test API Keys**
   - Click **Developers** → **API keys** in the left sidebar
   - You'll see two keys:
     - **Publishable key** (starts with `pk_test_...`) - This is public, safe to expose
     - **Secret key** (starts with `sk_test_...`) - Keep this secret!
   - Click "Reveal test key" to see your secret key
   - Copy both keys

### Step 2: Add Keys to Your App

1. **Create or edit `.env.local`** in your project root:
   ```env
   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   
   # Webhook Secret (we'll get this in Step 3)
   STRIPE_WEBHOOK_SECRET=whsec_placeholder
   
   # Your app URL (for redirects)
   NEXT_PUBLIC_URL=http://localhost:3000
   ```

2. **Restart your dev server** after adding the keys:
   ```bash
   npm run dev
   ```

### Step 3: Set Up Webhooks (For Local Development)

Webhooks let Stripe notify your app when payments complete. For local development, use Stripe CLI:

1. **Install Stripe CLI:**
   - Windows: Download from https://github.com/stripe/stripe-cli/releases
   - Or use: `scoop install stripe` (if you have Scoop)

2. **Login to Stripe CLI:**
   ```bash
   stripe login
   ```
   - This will open your browser to authorize

3. **Forward webhooks to your local server:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Copy the webhook secret:**
   - The CLI will show a message like: `Ready! Your webhook signing secret is whsec_xxxxx`
   - Copy that `whsec_xxxxx` value
   - Update `.env.local`:
     ```env
     STRIPE_WEBHOOK_SECRET=whsec_xxxxx
     ```

5. **Keep the CLI running** while testing payments

### Step 4: Create Products in Stripe Dashboard

Your app needs products in Stripe that match your pricing tiers. Here's what to create:

#### User Subscription Products:

1. **Go to Products** → **Add product**

2. **Create "WorkVouch Pro"** (or "PeerCV Pro" if you haven't rebranded):
   - Name: `WorkVouch Pro`
   - Description: `AI-enhanced résumé tools and extended coworker requests`
   - Pricing:
     - Add price: **$8.99/month** (recurring, monthly)
     - Add another price: **$84.00/year** (recurring, yearly)
   - **Save the Price IDs** (they start with `price_...`)

3. **Create "WorkVouch Elite"**:
   - Name: `WorkVouch Elite`
   - Description: `Full verification + unlimited coworker requests + premium features`
   - Pricing:
     - **$19.99/month** (recurring, monthly)
     - **$198.00/year** (recurring, yearly)
   - **Save the Price IDs**

#### Employer Subscription Products:

4. **Create "Employer Lite"**:
   - Name: `Employer Lite`
   - Description: `20 profile lookups/month with full access to verified work history`
   - Pricing: **$49.00/month** (recurring, monthly)
   - **Save the Price ID**

5. **Create "Employer Pro"**:
   - Name: `Employer Pro`
   - Description: `100 monthly lookups, priority matching, ATS integrations`
   - Pricing: **$149.00/month** (recurring, monthly)
   - **Save the Price ID**

6. **Create "Employer Enterprise"**:
   - Name: `Employer Enterprise`
   - Description: `Unlimited lookups, custom API access, turnover insights`
   - Pricing: **$499.00/month** (recurring, monthly)
   - **Save the Price ID**

#### One-Time Payment Product:

7. **Create "Pay-Per-Lookup"**:
   - Name: `Pay-Per-Lookup`
   - Description: `Single candidate profile lookup`
   - Pricing: **$7.99** (one-time payment, not recurring)
   - **Save the Price ID**

### Step 5: Map Price IDs to Your App

You have two options:

#### Option A: Store in Environment Variables (Recommended)

Add all your Price IDs to `.env.local`:
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

Then update `components/pricing-section.tsx` to use these environment variables when creating checkout sessions.

#### Option B: Update the Products File

Update `lib/stripe/products.ts` to include `stripePriceId` in each price object, or create a mapping function that converts your product IDs to Stripe Price IDs.

### Step 6: Test the Integration

1. **Start your app:**
   ```bash
   npm run dev
   ```

2. **Make sure Stripe CLI is running** (for webhook forwarding):
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. **Test a subscription:**
   - Go to `/pricing` in your app
   - Click "Subscribe" on any plan
   - Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

4. **Verify it worked:**
   - You should be redirected back to your app
   - Check Stripe Dashboard → **Events** to see the webhook was received
   - Check your database `user_subscriptions` table for the new subscription

## Production Setup

When you're ready to go live:

1. **Switch to Live Mode:**
   - In Stripe Dashboard, toggle to **Live mode** (top right)
   - Copy your **Live API keys** (starts with `pk_live_` and `sk_live_`)
   - Update your production environment variables

2. **Create Production Webhook:**
   - Go to **Developers** → **Webhooks**
   - Click **Add endpoint**
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `payment_intent.payment_failed`
   - Copy the webhook signing secret
   - Update production environment variables

3. **Test with real cards:**
   - Start with small amounts
   - Use Stripe's test cards first
   - Then test with real cards

## Troubleshooting

### "Stripe is not configured" error
- Make sure `STRIPE_SECRET_KEY` is set in `.env.local`
- Restart your dev server after adding the key

### Webhook not receiving events
- Make sure Stripe CLI is running (for local dev)
- Check the webhook URL is correct
- Verify `STRIPE_WEBHOOK_SECRET` matches what Stripe CLI shows
- Check Stripe Dashboard → **Events** for delivery status

### Checkout not redirecting
- Verify `NEXT_PUBLIC_URL` is set correctly
- Check browser console for errors
- Make sure user is authenticated

### Subscription not created in database
- Check webhook is receiving `checkout.session.completed` event
- Check Supabase logs for errors
- Verify `stripe_customer_id` column exists in `profiles` table

## Test Cards

Use these in Stripe test mode:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`
- **3D Secure**: `4000 0027 6000 3184`

## What's Already Set Up

Your app already has:
- ✅ Stripe SDK installed
- ✅ Checkout session creation (`/api/stripe/checkout`)
- ✅ Webhook handler (`/api/stripe/webhook`)
- ✅ Billing portal (`/api/stripe/portal`)
- ✅ Product configuration (`lib/stripe/products.ts`)
- ✅ Pricing component with Stripe integration

You just need to:
- Add API keys
- Create products in Stripe
- Map Price IDs to your app
- Set up webhooks

## Next Steps

After connecting Stripe:
1. Test all subscription tiers
2. Test pay-per-lookup
3. Test subscription cancellation
4. Test billing portal access
5. Set up production webhook when deploying

## Need Help?

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
