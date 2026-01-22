import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/admin";
import Stripe from "stripe";

// Mark route as dynamic to prevent build-time evaluation
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Initialize Stripe lazily to avoid build-time errors
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is required");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-12-15.clover",
  });
}

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe();
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
