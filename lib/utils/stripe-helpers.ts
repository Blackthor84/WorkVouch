/**
 * Stripe Helper Functions
 * Reusable functions for Stripe operations
 */

export interface CheckoutItem {
  name: string
  price: number
  quantity: number
}

/**
 * Create checkout session with items and redirect to Stripe
 * @param items - Array of items to purchase with name, price, and quantity
 */
export async function createCheckoutSession(items: CheckoutItem[]) {
  const origin = window.location.origin

  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, origin }),
  })

  const data = await res.json()
  if (data.error) throw new Error(data.error)

  if (data.url) {
    window.location.href = data.url
  } else {
    throw new Error('No checkout URL returned')
  }
}

/**
 * Open Stripe billing portal
 */
export async function openBillingPortal() {
  const res = await fetch('/api/stripe/portal', { method: 'POST' })
  
  if (!res.ok) {
    // Try to parse JSON error, but handle HTML error pages
    let errorMessage = 'Failed to open billing portal'
    try {
      const error = await res.json()
      errorMessage = error.error || errorMessage
    } catch {
      // If response is not JSON (e.g., HTML error page), use status text
      errorMessage = `Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.`
    }
    throw new Error(errorMessage)
  }

  const { url } = await res.json()
  if (url) {
    window.location.href = url
  }
}

/**
 * Create checkout session and redirect
 */
export async function checkout(priceId: string) {
  const res = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId }),
  })

  if (!res.ok) {
    // Try to parse JSON error, but handle HTML error pages
    let errorMessage = 'Failed to create checkout session'
    try {
      const error = await res.json()
      errorMessage = error.error || errorMessage
    } catch {
      // If response is not JSON (e.g., HTML error page), use status text
      errorMessage = `Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.`
    }
    throw new Error(errorMessage)
  }

  const { url } = await res.json()
  if (url) {
    window.location.href = url
  }
}
