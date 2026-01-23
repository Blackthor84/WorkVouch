# WorkVouch Components Reference

## FixedImage Component

Next.js 16.1.4 compatible image component that forces `loading="eager"` on all images.

**Location:** `components/FixedImage.tsx`

**Usage:**
```tsx
import FixedImage from "@/components/FixedImage";

<FixedImage
  src="/images/example.jpg"
  alt="Example Image"
  width={800}
  height={400}
  className="rounded-lg mb-6 shadow-lg object-cover w-full"
  unoptimized
/>
```

**Props:**
- `src` (required) - Image source
- `alt` (required) - Alt text
- `width` (optional) - Image width
- `height` (optional) - Image height
- `unoptimized` (optional) - Disable Next.js image optimization
- `loader` (optional) - Custom image loader function
- All standard HTML image attributes (via HTMLAttributes)

## PricingModal Components

### Simple PricingModal

**Location:** `components/PricingModalSimple.tsx`

Simplified version that accepts just a `tier` prop and handles Stripe checkout.

**Usage:**
```tsx
import { PricingModal } from "@/components/PricingModalSimple";

<PricingModal tier="Pro" />
```

### Advanced PricingModal

**Location:** `components/PricingModal.tsx`

Full-featured version with subscription status polling, auto-unlock, and support for free tiers.

**Usage:**
```tsx
import { PricingModal } from "@/components/PricingModal";

<PricingModal
  tier="Pro"
  price="$99/mo"
  benefits={["Feature 1", "Feature 2"]}
  priceId="price_xxxxx"
  userId={userId}
  userType="employer"
/>
```

## API Routes

### Tier-based Checkout (App Router)

**Location:** `app/api/create-checkout-session/route.ts`

Accepts `tier` parameter and maps to Stripe Price IDs.

**Request:**
```json
POST /api/create-checkout-session
{
  "tier": "Pro"
}
```

**Response:**
```json
{
  "id": "session_id"
}
```

**Note:** This project uses **App Router** (`app/api/`), not Pages Router (`pages/api/`). The route uses `NextRequest` and `NextResponse` instead of `NextApiRequest` and `NextApiResponse`.

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXX
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXX
STRIPE_PRICE_BASIC=price_xxxxx
STRIPE_PRICE_PRO=price_xxxxx
STRIPE_PRICE_ENTERPRISE=price_xxxxx
```

## Notes

1. **FixedImage** is fully compatible with Next.js 16.1.4 — no more ImageProps / ImageLoaderProps errors.
2. **PricingModal** works with Stripe. Make sure your price IDs in Stripe match tier strings or use the advanced version with direct `priceId`.
3. The API route uses **App Router** format, not Pages Router format.
