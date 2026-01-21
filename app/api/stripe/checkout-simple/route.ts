import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Stripe secret key from environment variable
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    })
  : null

export async function POST(req: NextRequest) {
  try {
    // Only access sensitive Supabase key at runtime
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL // non-sensitive
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // sensitive, runtime-only

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'supabaseUrl is required' },
        { status: 500 }
      )
    }
    if (!supabaseKey) {
      return NextResponse.json(
        { error: 'supabaseKey is required' },
        { status: 500 }
      )
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Example: fetch user data if needed
    // const { data, error } = await supabase.from('users').select('*')
    // if (error) throw error

    // Read JSON payload from frontend
    const body = await req.json()

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: body.items.map((item: { name: string; price: number; quantity: number }) => ({
        price_data: {
          currency: 'usd',
          product_data: { name: item.name },
          unit_amount: item.price * 100, // convert to cents
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${body.origin}/success`,
      cancel_url: `${body.origin}/cancel`,
    })

    return NextResponse.json({ url: session.url }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
