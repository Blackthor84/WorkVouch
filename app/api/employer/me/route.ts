import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser, hasRole } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isEmployer = await hasRole('employer')
    if (!isEmployer) {
      return NextResponse.json({ error: 'Not an employer account' }, { status: 403 })
    }

    const supabase = await createServerClient()

    const { data: employerAccount, error } = await supabase
      .from('employer_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error || !employerAccount) {
      return NextResponse.json({ error: 'Employer not found' }, { status: 404 })
    }

    return NextResponse.json({
      employer: {
        id: employerAccount.id,
        companyName: employerAccount.company_name,
        email: user.email,
        planTier: employerAccount.plan_tier,
        stripeCustomerId: employerAccount.stripe_customer_id,
        createdAt: employerAccount.created_at,
      },
    })
  } catch (error) {
    console.error('Get employer error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employer' },
      { status: 500 }
    )
  }
}
