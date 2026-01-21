import { NextResponse } from 'next/server'
import { stripe, isStripeConfigured } from '@/lib/stripe/config'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth'

// Mark route as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Create Supabase admin client lazily to avoid build-time errors
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.supabaseUrl
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabaseKey

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured')
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Create Stripe Checkout Session
 * POST /api/stripe/create-checkout-session
 * Body: { priceId: string }
 */
export async function POST(req: Request) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured || !stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.' },
        { status: 503 }
      )
    }

    const { priceId } = await req.json()

    if (!priceId) {
      return NextResponse.json(
        { error: 'priceId is required' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not logged in' },
        { status: 401 }
      )
    }

    // Get or create Stripe customer
    const supabaseAdmin = getSupabaseAdmin()
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || profile?.email,
        metadata: { supabase_user_id: user.id },
      })

      customerId = customer.id

      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Get price details to determine if it's subscription or one-time
    const price = await stripe.prices.retrieve(priceId)
    const isSubscription = price.type === 'recurring'

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? 'subscription' : 'payment',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/dashboard?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/pricing?canceled=true`,
      metadata: {
        user_id: user.id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
