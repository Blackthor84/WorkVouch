# Stripe is Now Optional

## ✅ Good News!

**You don't need Stripe to use the app!** The app will work without Stripe configured.

## What Works Without Stripe

- ✅ User signup and login
- ✅ Profile creation and editing
- ✅ Job history management
- ✅ Coworker matching
- ✅ Peer references
- ✅ Trust score calculations
- ✅ Messaging
- ✅ All core features

## What Requires Stripe

- ❌ Subscriptions (Pro/Elite tiers)
- ❌ Employer subscriptions
- ❌ Pay-per-lookup purchases
- ❌ Billing portal access

## If You See Stripe Errors

If you see errors like:
- `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
- `Stripe is not configured`

**This is normal!** The app will still work for all non-payment features.

## To Enable Stripe Later

When you're ready to add payments:

1. **Create Stripe Account**: https://stripe.com
2. **Get API Keys**: Dashboard → Developers → API keys
3. **Add to `.env.local`**:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
4. **See**: `STRIPE_SETUP_GUIDE.md` for full instructions

---

**The app works perfectly without Stripe - you can test everything except payments!**
