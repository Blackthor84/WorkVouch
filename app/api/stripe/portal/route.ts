import { NextResponse } from 'next/server'
import { stripe, isStripeConfigured } from '@/lib/stripe/config'
import { supabaseServer } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth'

// Mark route as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Create Stripe Billing Portal Session
 * Allows users to manage their subscriptions, payment methods, and billing
 * POST /api/stripe/portal
 */
export async function POST() {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured || !stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.' },
        { status: 503 }
      )
    }

    // Get authenticated user using our auth helper
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'User not signed in' },
        { status: 401 }
      )
    }

    // Get profile with Stripe customer ID using admin client
    const supabaseAny = supabaseServer as any
    const { data: profile } = await supabaseAny
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    const profileTyped = profile as { stripe_customer_id: string | null } | null

    if (!profileTyped?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Please subscribe first.' },
        { status: 400 }
      )
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: profileTyped.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/dashboard`,
    })

    return NextResponse.json({ url: portal.url })
  } catch (error: any) {
    console.error('Stripe portal error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
