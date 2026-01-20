import { NextRequest, NextResponse } from 'next/server'
import { supabaseTyped } from '@/lib/supabase-fixed'
import { getCurrentUser, hasRole } from '@/lib/auth'
import { stripe } from '@/lib/stripe/config'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isEmployer = await hasRole('employer')
    if (!isEmployer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }

    const supabase = await supabaseTyped()
    const supabaseAny = supabase as any

    type EmployerAccountRow = { stripe_customer_id: string | null }
    const { data: employerAccount, error: employerError } = await supabaseAny
      .from('employer_accounts')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    const employerAccountTyped = employerAccount as EmployerAccountRow | null

    if (employerError || !employerAccountTyped || !employerAccountTyped.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: employerAccountTyped.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL}/employer/dashboard`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: any) {
    console.error('Billing portal error:', error)
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    )
  }
}
