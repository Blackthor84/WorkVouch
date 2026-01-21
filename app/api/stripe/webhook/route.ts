import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { supabaseTyped } from '@/lib/supabase-fixed'
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
          const planTier = session.metadata?.planTier || session.metadata?.plan

          if (employerId && planTier) {
            const supabase = await supabaseTyped()
            const supabaseAny = supabase as any
            
            // Map plan names to plan_tier values
            const planTierMap: Record<string, string> = {
              pro: 'pro',
              enterprise: 'enterprise',
              basic: 'basic',
            }
            
            const mappedTier = planTierMap[planTier.toLowerCase()] || planTier

            await supabaseAny
              .from('employer_accounts')
              .update({
                plan_tier: mappedTier as 'basic' | 'pro' | 'enterprise',
                stripe_customer_id: subscription.customer as string,
              })
              .eq('id', employerId)
          } else if (session.customer_email) {
            // Fallback: find employer by email if metadata not available
            const supabase = await supabaseTyped()
            const supabaseAny = supabase as any
            
            type ProfileRow = { id: string }
            const { data: profile } = await supabaseAny
              .from('profiles')
              .select('id')
              .eq('email', session.customer_email)
              .single()

            if (profile) {
              const profileTyped = profile as ProfileRow
              const planTier = session.metadata?.plan || 'pro'
              const planTierMap: Record<string, string> = {
                pro: 'pro',
                enterprise: 'enterprise',
                basic: 'basic',
              }
              const mappedTier = planTierMap[planTier.toLowerCase()] || 'pro'

              await supabaseAny
                .from('employer_accounts')
                .update({
                  plan_tier: mappedTier as 'basic' | 'pro' | 'enterprise',
                  stripe_customer_id: subscription.customer as string,
                })
                .eq('user_id', profileTyped.id)
            }
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        const supabase = await supabaseTyped()
        const supabaseAny = supabase as any
        type EmployerAccountRow = { id: string }
        const { data: employer } = await supabaseAny
          .from('employer_accounts')
          .select('id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (employer) {
          const employerTyped = employer as EmployerAccountRow
          // Determine plan tier from subscription
          // You may need to map price IDs to plan tiers
          const planTier = subscription.status === 'active' ? 'basic' : 'free'

          await supabaseAny
            .from('employer_accounts')
            .update({ plan_tier: planTier })
            .eq('id', employerTyped.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const supabase = await supabaseTyped()
        const supabaseAny = supabase as any
        type EmployerAccountRow = { id: string }
        const { data: employer } = await supabaseAny
          .from('employer_accounts')
          .select('id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (employer) {
          const employerTyped = employer as EmployerAccountRow
          await supabaseAny
            .from('employer_accounts')
            .update({ plan_tier: 'free' })
            .eq('id', employerTyped.id)
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
