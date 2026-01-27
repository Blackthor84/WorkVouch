import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

/**
 * Stripe Checkout API Route
 * Handles all active prices, including Free ($0)
 */
export async function POST(req: Request) {
  try {
    const { priceId } = await req.json();

    if (!priceId || typeof priceId !== "string") {
      return NextResponse.json({ error: "priceId is required" }, { status: 400 });
    }

    // Get base URL
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3000";

    // Free tier handling
    if (priceId === "free") {
      return NextResponse.json({
        url: `${origin}/pricing/success?session_id=free`,
      });
    }

    // Validate that the price exists in Stripe
    const price = await stripe.prices.retrieve(priceId).catch(() => null);
    if (!price || !price.active) {
      return NextResponse.json({ error: "Price not found in Stripe" }, { status: 400 });
    }

    // Determine mode: one_time vs subscription
    const isOneTime = price.type === "one_time";
    const mode = isOneTime ? "payment" : "subscription";

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=true`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
