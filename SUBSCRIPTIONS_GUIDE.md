# PeerCV Subscription System Guide

## Overview

PeerCV now supports multiple subscription tiers for both users and employers, plus a pay-per-lookup option. This guide explains how to set up and use the subscription system.

## Subscription Tiers

### User Plans

1. **Starter (Free)**
   - Basic work history verification
   - Up to 5 job entries
   - Public profile
   - Basic trust score

2. **Pro ($8.99/month or $84/year)**
   - Everything in Starter
   - Unlimited job entries
   - AI-enhanced résumé tools
   - Extended coworker requests
   - Priority support

3. **Elite ($19.99/month or $198/year)**
   - Everything in Pro
   - Full verification
   - Unlimited coworker requests
   - Premium features
   - Advanced analytics
   - Priority support

### Employer Plans

1. **Lite ($49/month)**
   - 20 profile lookups per month
   - Basic candidate reports
   - Trust score access
   - Email support

2. **Pro ($149/month)**
   - 100 profile lookups per month
   - Full candidate reports
   - Priority matching
   - Advanced search filters
   - Email & phone support

3. **Enterprise ($499/month)**
   - Unlimited lookups
   - Full candidate reports
   - API access
   - Dedicated account manager
   - Custom integrations
   - 24/7 priority support

### Pay-Per-Lookup

- **Single Lookup ($7.99)**
  - One-time payment for a single candidate report
  - No subscription required
  - Perfect for occasional use

## Database Setup

Run the subscription schema:

```sql
-- Run supabase/schema_v2_subscriptions.sql in Supabase SQL Editor
```

This creates:
- `user_subscriptions` table - Tracks all subscriptions
- `employer_lookups` table - Tracks lookup usage
- Helper functions for quota checking and lookup recording

## Stripe Setup

### 1. Create Products in Stripe Dashboard

For each product in `lib/stripe/products.ts`:

1. Go to Stripe Dashboard → Products
2. Create product with matching name and description
3. Add prices (monthly/yearly as specified)
4. Copy the Price IDs

### 2. Update Environment Variables

You'll need to map product IDs to Stripe Price IDs. You can either:

**Option A: Use Stripe API to sync products**
```typescript
// Create a sync script that creates products in Stripe
// and stores the price IDs in your database
```

**Option B: Hardcode price IDs in environment**
```env
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_YEARLY=price_xxx
STRIPE_PRICE_ELITE_MONTHLY=price_xxx
# ... etc
```

### 3. Update Pricing Component

Update `components/pricing-section.tsx` to use actual Stripe Price IDs:

```typescript
const handleSubscribe = async (productId: string, priceId: string) => {
  // Use the actual priceId from Stripe
  const { url } = await createSubscriptionCheckout(priceId, productId)
  window.location.href = url
}
```

## How It Works

### Subscription Flow

1. User clicks "Subscribe" on pricing page
2. `createSubscriptionCheckout()` creates Stripe Checkout session
3. User completes payment in Stripe
4. Webhook receives `checkout.session.completed` event
5. Subscription record created in `user_subscriptions` table
6. User gains access to premium features

### Employer Lookup Flow

1. Employer searches for candidates
2. System checks `check_employer_lookup_quota()` function
3. If subscription has quota:
   - Allow access immediately
   - Record lookup in `employer_lookups` table
4. If no subscription/quota:
   - Show "Purchase Report" or "Subscribe" buttons
   - Redirect to checkout

### Pay-Per-Lookup Flow

1. Employer clicks "Purchase Report ($7.99)"
2. `createOneTimeCheckout()` creates Stripe Checkout session
3. User completes payment
4. Webhook records lookup in `employer_lookups` table
5. Employer gains access to that specific report

## Webhook Events

The webhook (`app/api/stripe/webhook/route.ts`) handles:

- `checkout.session.completed` - Creates subscription or records purchase
- `customer.subscription.updated` - Updates subscription status
- `customer.subscription.deleted` - Marks subscription as canceled
- `payment_intent.payment_failed` - Marks purchase as failed

## Usage Tracking

### For Employers

The system tracks:
- Lookups per billing period (for subscription tiers)
- Total lookups (for quota enforcement)
- Which candidates were viewed

### Quota Checking

The `check_employer_lookup_quota()` function:
- Gets employer's subscription tier
- Determines quota (20/100/unlimited)
- Counts lookups in current period
- Returns `true` if quota available

## Subscription Management

Users can:
- View current subscription in dashboard
- Cancel subscription (cancels at period end)
- Upgrade/downgrade via pricing page

## Testing

### Test Subscription

1. Use Stripe test card: `4242 4242 4242 4242`
2. Set future expiry date
3. Any CVC
4. Complete checkout
5. Verify subscription created in database

### Test Quota

1. Subscribe as employer (Lite = 20 lookups)
2. View 20 candidate reports
3. Try to view 21st - should require purchase/subscription

### Test Pay-Per-Lookup

1. As employer without subscription
2. Click "Purchase Report ($7.99)"
3. Complete checkout
4. Verify lookup recorded
5. Verify report accessible

## Migration Notes

Existing `employer_purchases` table still works for backward compatibility. The system checks:
1. Subscription quota first
2. One-time purchases second
3. Falls back to requiring new purchase

## Troubleshooting

### Subscription Not Created

- Check webhook is receiving events
- Verify webhook secret matches
- Check Stripe dashboard for errors
- Review server logs

### Quota Not Working

- Verify `check_employer_lookup_quota()` function exists
- Check subscription status is 'active' or 'trialing'
- Verify `current_period_end` is in future
- Check `employer_lookups` table for records

### Price IDs Not Found

- Ensure products created in Stripe
- Copy correct Price IDs
- Update pricing component with actual IDs
- Test with Stripe test mode first

## Next Steps

- Add subscription management page
- Implement upgrade/downgrade flow
- Add usage analytics dashboard
- Email notifications for subscription events
- Proration handling for upgrades
