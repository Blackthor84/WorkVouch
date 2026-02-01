# Stripe Subscription System — Implementation Summary

Production-ready Stripe subscription flow for WorkVouch using **Next.js App Router**, Supabase, and Vercel. (The project uses App Router; there is no `pages/` directory.)

---

## 1. Create Checkout Session API

**Route:** `POST /api/create-checkout-session`

**File:** `app/api/create-checkout-session/route.ts`

- **Body:** `{ priceId: string }` — must be a whitelisted Stripe Price ID.
- **Validation:** `isPriceIdWhitelisted(priceId)` — only price IDs starting with `price_` and present in env-derived whitelist are allowed.
- **Auth:** Optional; if user is logged in, `supabase_user_id` (NextAuth user id) is attached to session metadata and `client_reference_id`.
- **Stripe session:** `mode: "subscription"`, `allow_promotion_codes: true`.
- **URLs:**
  - Success: `{baseUrl}/dashboard?success=true`
  - Cancel: `{baseUrl}/pricing?canceled=true`
- **Base URL:** From `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_APP_URL`, `NEXTAUTH_URL`, or `VERCEL_URL`.
- **Response:** `{ id, url }` — redirect client to `url`.

**Whitelist (env):** Any of these set and starting with `price_` are allowed:

- `STRIPE_PRICE_STARTER_MONTHLY` / `PRICE_ID_STARTER_MONTHLY` / `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_STARTER_YEARLY` / `PRICE_ID_STARTER_YEARLY`
- `STRIPE_PRICE_GROWTH_MONTHLY` / `PRICE_ID_GROWTH_MONTHLY` / `STRIPE_PRICE_TEAM`
- `STRIPE_PRICE_GROWTH_YEARLY` / `PRICE_ID_GROWTH_YEARLY`
- `STRIPE_PRICE_PRO_MONTHLY` / `PRICE_ID_PRO_MONTHLY` / `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_PRO_YEARLY` / `PRICE_ID_PRO_YEARLY`

---

## 2. Stripe Webhook

**Route:** `POST /api/stripe/webhook`

**File:** `app/api/stripe/webhook/route.ts`

- **Body:** Raw body only — `req.text()` used for signature verification.
- **Verification:** `stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)`.
- **Env:** `STRIPE_WEBHOOK_SECRET` required.

**Events handled:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Retrieve subscription; set `stripe_customer_id` on employer_accounts (by `metadata.employerId` or `metadata.supabase_user_id`); call `updateEmployerFromSubscription`. |
| `customer.subscription.created` / `customer.subscription.updated` | Update employer_accounts by `stripe_customer_id`: plan_tier, stripe_subscription_id, subscription_status, subscription_interval, lookup_quota, overage item IDs. |
| `customer.subscription.deleted` | Set plan_tier = starter, stripe_subscription_id = null, subscription_status = canceled, subscription_interval = null, lookup_quota = 5. |
| `invoice.payment_succeeded` | Refresh subscription fields and reset usage/billing cycle. |

**Employer fields updated (when subscription exists):**

- `stripe_subscription_id`, `plan_tier`, `subscription_status`, `subscription_interval`, `lookup_quota`
- `stripe_report_overage_item_id`, `stripe_search_overage_item_id`, `stripe_seat_overage_item_id` (if used)

**Lookup quota by tier:**

- Starter: 5  
- Growth / Team: 25  
- Pro: -1 (unlimited)

---

## 3. Database Schema

**Migration:** `supabase/migrations/20250129000006_stripe_subscription_columns.sql`

Adds to `employer_accounts` (if not present):

- `subscription_status` (TEXT) — e.g. active, canceled, past_due
- `subscription_interval` (TEXT) — month | year
- `lookup_quota` (INTEGER, default 5) — -1 = unlimited

Existing columns used: `stripe_customer_id`, `stripe_subscription_id`, `plan_tier` (already on employer_accounts).

**Apply:** Run the migration in Supabase (SQL editor or `supabase db push`).

---

## 4. Customer Portal

**Routes:**

- `POST /api/stripe/portal`
- `POST /api/create-portal-session` (same behavior)

**Files:** `app/api/stripe/portal/route.ts`, `app/api/create-portal-session/route.ts`

- **Auth:** Required (getCurrentUser).
- **Customer ID:** From `employer_accounts.stripe_customer_id` (by user_id) first; else `profiles.stripe_customer_id`.
- **Stripe:** `stripe.billingPortal.sessions.create({ customer, return_url: baseUrl/dashboard })`.
- **Response:** `{ url }` — redirect client to Stripe Billing Portal.

---

## 5. Pricing Page

**Route:** `/pricing` (page: `app/(public)/pricing/page.tsx`)

- **State:** `billingInterval` (monthly | yearly); `loadingPlan`.
- **Plans:** In-component array with `id`, `name`, `positioning`, `lookups`, `prices.monthly`, `prices.yearly` (amount + stripePriceId from env or placeholder).
- **Rendering:** `plans?.map(...)`; `plan?.positioning`, `plan?.prices?.[interval]`, `currentPrice?.amount`, `currentPrice?.stripePriceId`; stable keys `plan.id`.
- **Checkout:** `handleCheckout(currentPrice?.stripePriceId)` → `POST /api/create-checkout-session` with `{ priceId }`; redirect to `data.url`. Button disabled when priceId missing or not starting with `price_`.
- **No Enterprise tier;** no hardcoded amounts in logic (only display fallbacks). Mobile-friendly layout.

---

## 6. Stripe Config

**File:** `lib/stripe/config.ts`

- **Whitelist:** `STRIPE_WHITELISTED_PRICE_IDS` (all env-derived price IDs that start with `price_`).
- **Helpers:** `isPriceIdWhitelisted(priceId)`, `getLookupQuotaForTier(tier)`, `getPriceToTierMap()` (includes starter/growth/pro monthly and yearly).
- **Base URL:** `getCheckoutBaseUrl()` uses `NEXT_PUBLIC_BASE_URL` first, then other env vars.

---

## 7. Security

- **Secrets:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — server-only; never exposed to client.
- **Checkout:** Only whitelisted price IDs accepted.
- **Webhook:** Signature verified; invalid signature returns 400.
- **Errors:** Logged server-side; no secret or raw Stripe objects in client responses.
- **Portal:** Requires authenticated user; customer ID from server-only Supabase (service role).

---

## 8. Environment Variables

```env
# Required for checkout + webhook
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: base URL (used for success/cancel and portal return)
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# Price IDs (at least one per plan; must start with price_ for whitelist)
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_YEARLY=price_...
STRIPE_PRICE_GROWTH_MONTHLY=price_...
STRIPE_PRICE_GROWTH_YEARLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...

# Or legacy names (used as fallback)
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_TEAM=price_...
STRIPE_PRICE_PRO=price_...
```

---

## 9. Final File List

| Purpose | File |
|--------|------|
| Checkout session | `app/api/create-checkout-session/route.ts` |
| Webhook | `app/api/stripe/webhook/route.ts` |
| Portal | `app/api/stripe/portal/route.ts` |
| Portal (alias) | `app/api/create-portal-session/route.ts` |
| Stripe config + whitelist + quota | `lib/stripe/config.ts` |
| Subscription columns | `supabase/migrations/20250129000006_stripe_subscription_columns.sql` |
| Pricing page | `app/(public)/pricing/page.tsx` |
| Doc | `STRIPE_SUBSCRIPTION_IMPLEMENTATION.md` |

---

## 10. Post-Implementation Check

- Subscriptions: User selects plan on `/pricing` → POST create-checkout-session → redirect to Stripe Checkout → after payment, redirect to `/dashboard?success=true`. Webhook updates employer_accounts (stripe_customer_id, plan_tier, subscription_status, subscription_interval, lookup_quota).
- Downgrades: On `customer.subscription.deleted`, employer_accounts set to starter, subscription_status canceled, lookup_quota 5.
- Pricing page: No crashes; optional chaining; no undefined access; mobile responsive; no Enterprise tier.
- Portal: POST from dashboard (or any authenticated page) to `/api/stripe/portal` or `/api/create-portal-session` → redirect to Stripe Billing Portal.
- Build: No console errors from these routes; fail gracefully on missing env or invalid priceId.
