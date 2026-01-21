import { NextRequest, NextResponse } from 'next/server'
import { stripe, isStripeConfigured } from '@/lib/stripe/config'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

// Mark route as dynamic
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Get Supabase admin client for updates
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.supabaseUrl || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabaseKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function POST(req: NextRequest) {
  try {
    if (!isStripeConfigured || !stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }

    const { plan, email } = await req.json()

    // Map plan names to price IDs (you'll need to set these in your .env)
    const priceIdMap: Record<string, string> = {
      pro: process.env.STRIPE_PRICE_PRO || '',
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE || '',
    }

    const priceId = priceIdMap[plan as string]

    if (!priceId) {
      return NextResponse.json(
        { error: `Invalid plan: ${plan}. Valid plans: pro, enterprise` },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      success_url: `${baseUrl}/employer/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        plan: plan as string,
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
