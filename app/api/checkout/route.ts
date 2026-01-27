import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

/**
 * Stripe Checkout API Route
 *
 * Handles subscriptions, one-time payments, and Free tier.
 *
 * POST /api/checkout
 * Body: { priceId: string }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { priceId } = body;

    if (!priceId || typeof priceId !== "string") {
      return NextResponse.json({ error: "priceId is required and must be a string" }, { status: 400 });
    }

    // --- Handle Free tier ---
    if (priceId === "free") {
      const origin =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

      return NextResponse.json({
        url: `${origin}/pricing/success?session_id=free`,
      });
    }

    // --- Debug logs ---
    console.log("STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY?.slice(-8)); // last 8 chars only
    console.log("Received priceId:", priceId);

    // Validate priceId format for Stripe
    if (!priceId.startsWith("price_")) {
      return NextResponse.json({ error: "Invalid priceId format" }, { status: 400 });
    }

    if (!stripe) {
      console.error("Stripe client not initialized!");
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    // --- Verify price exists in Stripe ---
    let stripePrice;
    try {
      stripePrice = await stripe.prices.retrieve(priceId);
    } catch (err: any) {
      console.error("Stripe price retrieval failed:", err);
      return NextResponse.json({ error: `Price not found in Stripe: ${err.message}` }, { status: 404 });
    }

    // --- Determine mode ---
    const isOneTime = stripePrice.type === "one_time";
    const mode = isOneTime ? "payment" : "subscription";

    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    // --- Create Stripe Checkout session ---
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=true`,
      allow_promotion_codes: true,
    });

    if (!session || !session.url) {
      console.error("Stripe session missing URL:", session);
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    console.log("Checkout session created:", session.id);

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Checkout API Error:", err);
    return NextResponse.json(
      { error: err.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
