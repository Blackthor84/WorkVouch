import { NextRequest, NextResponse } from 'next/server'
import { stripe, isStripeConfigured } from '@/lib/stripe/config'
import { supabaseTyped } from '@/lib/supabase-fixed'
import { createClient } from '@supabase/supabase-js'
import { hasRole } from '@/lib/auth'
import { productIdToTier } from '@/lib/stripe/products'

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

/**
 * Create Stripe Checkout Session
 * Supports both subscriptions and one-time payments
 * POST /api/stripe/checkout
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured || !stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { priceId, productId, candidateId, mode = 'subscription' } = body

    if (!priceId) {
      return NextResponse.json(
        { error: 'priceId is required' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await supabaseTyped()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not logged in' },
        { status: 401 }
      )
    }

    // Get or create Stripe customer
    const supabaseAdminAny = supabaseAdmin as any
    type ProfileRow = { stripe_customer_id: string | null; email: string }
    const { data: profile } = await supabaseAdminAny
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    const profileTyped = profile as ProfileRow | null
    let customerId = profileTyped?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || profileTyped?.email,
        metadata: { supabase_user_id: user.id },
      })

      customerId = customer.id

      await supabaseAdminAny
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Determine checkout mode and URLs
    const isSubscription = mode === 'subscription' || body.mode === 'subscription'
    const baseUrl = process.env.NEXT_PUBLIC_URL || request.nextUrl.origin

    let successUrl = `${baseUrl}/dashboard?subscription=success`
    let cancelUrl = `${baseUrl}/pricing`
    let metadata: Record<string, string> = {
      user_id: user.id,
    }

    if (isSubscription) {
      // Subscription checkout
      if (productId) {
        metadata.product_id = productId
        metadata.tier = productIdToTier(productId)
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
      })

      return NextResponse.json({ url: session.url })
    } else {
      // One-time payment (candidate report or pay-per-lookup)
      if (candidateId) {
        // Candidate report purchase
        const isEmployer = await hasRole('employer')
        if (!isEmployer) {
          return NextResponse.json(
            { error: 'Only employers can purchase reports' },
            { status: 403 }
          )
        }

        // Verify candidate exists
        type CandidateRow = { id: string; full_name: string; email: string }
        const { data: candidate } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', candidateId)
          .single()

        if (!candidate) {
          return NextResponse.json(
            { error: 'Candidate not found' },
            { status: 404 }
          )
        }

        const candidateTyped = candidate as CandidateRow

        if (candidateTyped.id === user.id) {
          return NextResponse.json(
            { error: 'Cannot purchase your own report' },
            { status: 400 }
          )
        }

        // Check if already purchased
        type EmployerPurchaseRow = { id: string; status: string }
        const { data: existingPurchase } = await supabaseAdminAny
          .from('employer_purchases')
          .select('id, status')
          .eq('employer_id', user.id)
          .eq('candidate_id', candidateId)
          .eq('status', 'completed')
          .single()

        if (existingPurchase) {
          const purchaseTyped = existingPurchase as EmployerPurchaseRow
          return NextResponse.json(
            { error: 'Report already purchased', purchaseId: purchaseTyped.id },
            { status: 400 }
          )
        }

        successUrl = `${baseUrl}/employer/reports/${candidateId}?session_id={CHECKOUT_SESSION_ID}`
        cancelUrl = `${baseUrl}/employer/search?canceled=true`
        metadata = {
          employer_id: user.id,
          candidate_id: candidateId,
          type: 'candidate_report',
        }

        // Create pending purchase record
        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          customer: customerId,
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata,
        })

        await supabaseAdminAny
          .from('employer_purchases')
          .insert([{
            employer_id: user.id,
            candidate_id: candidateId,
            stripe_checkout_session_id: session.id,
            amount_paid: 7.99, // Default, should come from price
            status: 'pending',
          }])

        return NextResponse.json({ url: session.url })
      } else {
        // Pay-per-lookup
        metadata.type = 'pay_per_lookup'

        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          customer: customerId,
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${baseUrl}/employer/search?payment=success`,
          cancel_url: `${baseUrl}/employer/search?canceled=true`,
          metadata,
        })

        return NextResponse.json({ url: session.url })
      }
    }
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
