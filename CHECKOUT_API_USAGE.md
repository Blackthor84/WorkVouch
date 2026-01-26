# Checkout API Usage Guide

## Endpoint: `/api/checkout`

A unified Stripe checkout endpoint for WorkVouch subscriptions.

### Key Features

- ✅ **Always Free for Employees**: Automatically redirects employees to free signup
- ✅ **Employer Subscriptions**: Handles all employer paid tiers
- ✅ **Flexible**: Accepts either `priceId` or `tierId`
- ✅ **Error Handling**: Comprehensive error messages

## Environment Variables

Set these in Vercel (or your environment):

```bash
STRIPE_SECRET_KEY=sk_live_... # Your Stripe secret key

# Employer Price IDs (from Stripe Dashboard)
EMPLOYER_STARTER_PRICE_ID=price_...
EMPLOYER_TEAM_PRICE_ID=price_...
EMPLOYER_PRO_PRICE_ID=price_...
EMPLOYER_ENTERPRISE_PRICE_ID=price_...
EMPLOYER_PAY_PER_USE_PRICE_ID=price_...
EMPLOYER_SECURITY_BUNDLE_PRICE_ID=price_...
```

## API Usage

### Request

```typescript
POST /api/checkout
Content-Type: application/json

{
  "priceId": "price_1234567890",  // Optional: Direct Stripe price ID
  "tierId": "team",                // Optional: Tier ID (maps to price ID)
  "userType": "employer",          // Optional: "employee" | "employer"
  "successUrl": "/success",        // Optional: Custom success URL
  "cancelUrl": "/pricing",         // Optional: Custom cancel URL
  "email": "user@example.com"       // Optional: Pre-fill email
}
```

### Response

**Success (Employer Subscription):**
```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_..."
}
```

**Success (Employee - Free):**
```json
{
  "url": "https://yourapp.com/auth/signup?plan=free",
  "isFree": true,
  "message": "WorkVouch is always free for employees"
}
```

**Error:**
```json
{
  "error": "Error message here"
}
```

## Frontend Usage Examples

### Example 1: Simple Checkout Function

```typescript
async function handleCheckout(priceId?: string, tierId?: string) {
  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      priceId,
      tierId,
      userType: "employer", // or "employee"
      successUrl: window.location.origin + "/pricing/success",
      cancelUrl: window.location.origin + "/pricing",
    }),
  });

  const data = await response.json();
  
  if (data.url) {
    window.location.href = data.url;
  } else {
    alert(data.error || "Checkout failed");
  }
}
```

### Example 2: Employee Free Access Button

```tsx
<button
  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
  onClick={() => handleCheckout(undefined, undefined, "employee")}
>
  Always Free for Employees
</button>
<p className="text-sm text-gray-600 mt-2">
  Build your verified work history, get peer references, and boost your trust score—completely free for all employees!
</p>
```

### Example 3: Employer Plan Selection

```tsx
const employerPlans = [
  { 
    name: "Starter", 
    tierId: "starter",
    description: "Perfect for small businesses and startups" 
  },
  { 
    name: "Team", 
    tierId: "team",
    description: "Ideal for growing teams and HR departments" 
  },
  { 
    name: "Pro", 
    tierId: "pro",
    description: "For established companies with high hiring volume" 
  },
  { 
    name: "Enterprise", 
    tierId: "enterprise",
    description: "Complete solution for large organizations" 
  },
];

<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
  {employerPlans.map((plan) => (
    <div key={plan.name} className="border p-6 rounded-lg shadow hover:shadow-lg transition">
      <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
      <p className="text-gray-600 mb-4">{plan.description}</p>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        onClick={() => handleCheckout(undefined, plan.tierId, "employer")}
      >
        Subscribe
      </button>
    </div>
  ))}
</div>
```

## Tier ID Mapping

The API automatically maps tier IDs to Stripe price IDs:

| Tier ID | Environment Variable | Description |
|---------|---------------------|-------------|
| `starter` | `EMPLOYER_STARTER_PRICE_ID` | Starter plan |
| `team` | `EMPLOYER_TEAM_PRICE_ID` | Team plan |
| `pro` | `EMPLOYER_PRO_PRICE_ID` | Pro plan |
| `enterprise` | `EMPLOYER_ENTERPRISE_PRICE_ID` | Enterprise plan |
| `pay-per-use` | `EMPLOYER_PAY_PER_USE_PRICE_ID` | Pay-per-use (one-time) |
| `security-bundle` | `EMPLOYER_SECURITY_BUNDLE_PRICE_ID` | Security Bundle |

## Important Notes

1. **Employees are Always Free**: If `userType === "employee"`, the API automatically redirects to free signup, bypassing Stripe entirely.

2. **Price ID vs Tier ID**: You can use either:
   - `priceId`: Direct Stripe price ID (more flexible)
   - `tierId`: Tier identifier (maps to price ID via environment variables)

3. **Subscription vs One-Time**: 
   - Most plans are subscriptions
   - `pay-per-use` is a one-time payment

4. **Error Handling**: Always check for `data.error` in the response before redirecting.

## Migration from `/api/pricing/checkout`

If you're currently using `/api/pricing/checkout`, you can:
- Keep both routes (they're compatible)
- Or migrate to `/api/checkout` for a simpler API

The new route has the same functionality but with a cleaner interface.
