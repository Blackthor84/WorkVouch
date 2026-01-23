# Stripe Pricing Setup - WorkVouch

This guide documents the Stripe pricing integration setup for WorkVouch.

## ✅ Dependencies Installed

All required dependencies are now installed:
- ✅ `@stripe/stripe-js` - Client-side Stripe integration
- ✅ `stripe` - Server-side Stripe SDK
- ✅ `react`, `react-dom`, `next`, `typescript` - Already installed

## 📁 API Routes

**Note:** This project uses **App Router** (`app/api/`), not Pages Router (`pages/api/`).

### 1. Tier-based Checkout Route
**Location:** `app/api/create-checkout-session/route.ts`

Accepts `tier` parameter ("Basic", "Pro", "Enterprise") and maps to Stripe Price IDs.

**Usage:**
```typescript
POST /api/create-checkout-session
Body: { tier: "Basic" | "Pro" | "Enterprise" }
Response: { id: "session_id" }
```

### 2. Price ID-based Checkout Route (Advanced)
**Location:** `app/api/stripe/create-checkout-session/route.ts`

Accepts `priceId` directly (more flexible, supports custom pricing).

**Usage:**
```typescript
POST /api/stripe/create-checkout-session
Body: { priceId: "price_xxx", userId?: string, userType?: "employee" | "employer" }
Response: { url: "checkout_url", id: "session_id" }
```

## 🔑 Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Keys (Required)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Stripe Price IDs (Optional - for tier-based checkout)
STRIPE_PRICE_BASIC=price_xxxxx
STRIPE_PRICE_PRO=price_xxxxx
STRIPE_PRICE_ENTERPRISE=price_xxxxx
```

## 🎨 Components

### PricingModal Component
**Location:** `components/PricingModal.tsx`

Enhanced component with:
- Stripe.js integration
- Subscription status polling
- Auto-unlock after payment
- Support for free tiers

**Basic Usage:**
```tsx
import { PricingModal } from "@/components/PricingModal";

<PricingModal
  tier="Pro"
  price="$99/mo"
  benefits={["Feature 1", "Feature 2"]}
  priceId="price_xxxxx"
/>
```

### CareerPricingPage Component
**Location:** `components/CareerPricingPage.tsx`

Standalone pricing page that automatically detects user type and shows appropriate tiers.

## 🚀 Quick Start

1. **Set Environment Variables:**
   ```bash
   # Add to .env.local
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```

2. **Get Stripe Price IDs:**
   - Go to Stripe Dashboard → Products
   - Create products for Basic, Pro, Enterprise
   - Copy the Price IDs (start with `price_`)
   - Add to `.env.local`:
     ```env
     STRIPE_PRICE_BASIC=price_xxxxx
     STRIPE_PRICE_PRO=price_xxxxx
     STRIPE_PRICE_ENTERPRISE=price_xxxxx
     ```

3. **Use in Your Components:**
   ```tsx
   // Simple tier-based checkout
   const res = await fetch("/api/create-checkout-session", {
     method: "POST",
     body: JSON.stringify({ tier: "Pro" })
   });
   const { id } = await res.json();
   
   // Use with Stripe.js
   const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
   await stripe!.redirectToCheckout({ sessionId: id });
   ```

## 📝 Differences from Pages Router

If you're following a Pages Router tutorial, note these differences:

| Pages Router | App Router (This Project) |
|-------------|---------------------------|
| `pages/api/` | `app/api/` |
| `export default function handler` | `export async function POST` |
| `req, res` parameters | `NextRequest, NextResponse` |
| `res.json()` | `NextResponse.json()` |

## ✅ Testing

1. Start dev server: `npm run dev`
2. Navigate to a page with pricing
3. Click "Select Plan"
4. Complete Stripe checkout (use test card: `4242 4242 4242 4242`)
5. Verify subscription is created in Stripe Dashboard

## 🔗 Related Files

- `components/PricingModal.tsx` - Main pricing modal component
- `components/CareerPricingPage.tsx` - Full pricing page
- `app/api/create-checkout-session/route.ts` - Tier-based checkout
- `app/api/stripe/create-checkout-session/route.ts` - Price ID-based checkout
- `app/api/subscription-status/route.ts` - Check subscription status
- `lib/stripe/config.ts` - Stripe configuration
