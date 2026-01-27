import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

// Mark route as dynamic to prevent build-time evaluation
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 }
      );
    }
    const supabase = supabaseServer;

    const body = await req.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: body.items.map(
        (item: { name: string; price: number; quantity: number }) => ({
          price_data: {
            currency: "usd",
            product_data: { name: item.name },
            unit_amount: item.price * 100,
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
