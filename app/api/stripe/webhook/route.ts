import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createServerClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    )
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )

          const employerId = session.metadata?.employerId
          const planTier = session.metadata?.planTier

          if (employerId && planTier) {
            const supabase = await createServerClient()
            await supabase
              .from('employer_accounts')
              .update({
                plan_tier: planTier as 'basic' | 'pro',
                stripe_customer_id: subscription.customer as string,
              })
              .eq('id', employerId)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        const supabase = await createServerClient()
        const { data: employer } = await supabase
          .from('employer_accounts')
          .select('id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (employer) {
          // Determine plan tier from subscription
          // You may need to map price IDs to plan tiers
          const planTier = subscription.status === 'active' ? 'basic' : 'free'

          await supabase
            .from('employer_accounts')
            .update({ plan_tier: planTier })
            .eq('id', employer.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const supabase = await createServerClient()
        const { data: employer } = await supabase
          .from('employer_accounts')
          .select('id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (employer) {
          await supabase
            .from('employer_accounts')
            .update({ plan_tier: 'free' })
            .eq('id', employer.id)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
