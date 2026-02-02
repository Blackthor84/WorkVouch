# Employer Pricing Page – Notes

## File

- **Page:** `app/(public)/pricing/page.tsx` (client component; no new subcomponents).

## Styling Notes

- **Pro emphasis:** Pro card uses `ring-2 ring-blue-500/50`, `shadow-lg`, `scale-[1.02]` (lg: `scale-[1.03]`), and “Most Popular” badge (`bg-blue-600` pill above card). Feature comparison table Pro column uses `bg-blue-50/80` and ring for emphasis.
- **Hierarchy:** Card title (plan name) → subtitle → price or $399/mo (Custom) → footnote → feature list → CTA. Plenty of spacing between sections.
- **Spacing:** Sections use `py-12`–`py-20`, cards `gap-6` (sm `gap-8`), table and compliance strip have clear padding.
- **Mobile:** Single column on small screens (`lg:grid-cols-3`), toggle and CTAs wrap with `flex-wrap` and `gap-4`.
- **Tone:** Professional, benefit-led copy; no clutter; comparison table and compliance strip are easy to scan.

## Stripe Tier Mapping (unchanged)

| UI tier | Display name        | Price (monthly/yearly) | Stripe env / behavior |
|--------|---------------------|------------------------|------------------------|
| **Lite**  | Essential Access    | $49 / $490             | `NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY` (fallback `STRIPE_PRICE_STARTER`), `NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEARLY`. Checkout: `POST /api/create-checkout-session` with `priceId`. |
| **Pro**   | Full Verification   | $149 / $1490           | `NEXT_PUBLIC_STRIPE_PRICE_GROWTH_MONTHLY` (fallback `STRIPE_PRICE_TEAM`), `NEXT_PUBLIC_STRIPE_PRICE_GROWTH_YEARLY`. Same checkout API. |
| **Custom**| Enterprise          | Contact Sales          | No Stripe price. CTA links to `/contact`. |

- **Checkout:** Pricing page calls `POST /api/create-checkout-session` with body `{ priceId }`. Price ID is chosen from `plan.prices[interval].stripePriceId` where `interval` is the current billing toggle (`monthly` | `yearly`). No Stripe logic was changed.
- **Whitelist:** `lib/stripe/config.ts` `STRIPE_WHITELISTED_PRICE_IDS` must include the same Starter/Growth monthly and yearly price IDs you set in env (and used on this page).

## Annual Toggle

- State: `billingInterval` (`"monthly"` | `"yearly"`).
- Toggle updates `billingInterval`; cards and “Start Lite” CTA use `plan.prices[interval]` (and thus the correct monthly or yearly `stripePriceId` and amount). Annual toggle is wired end-to-end.
