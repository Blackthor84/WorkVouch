import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { supabaseServer } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 },
      );
    }

    const supabase = supabaseServer;

    // Example: fetch user data if needed
    // const { data, error } = await supabase.from('users').select('*')
    // if (error) throw error

    // Read JSON payload from frontend
    const body = await req.json();

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: body.items.map(
        (item: { name: string; price: number; quantity: number }) => ({
          price_data: {
            currency: "usd",
            product_data: { name: item.name },
            unit_amount: item.price * 100, // convert to cents
          },
          quantity: item.quantity,
        }),
      ),
      mode: "payment",
      success_url: `${body.origin}/success`,
      cancel_url: `${body.origin}/cancel`,
    });

    return NextResponse.json(
      { url: session.url },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
