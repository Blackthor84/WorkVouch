// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

// ✅ Initialize Stripe with latest API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

/**
 * POST /api/checkout
 * Body: { priceId: string }
 * Returns: { url: string } - Stripe Checkout URL
 */
export async function POST(req: Request) {
  try {
    // Parse JSON body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { priceId } = body;

    // Validate priceId
    if (!priceId || typeof priceId !== "string") {
      return NextResponse.json(
        { error: "priceId is required and must be a string" },
        { status: 400 }
      );
    }

    if (!priceId.startsWith("price_")) {
      return NextResponse.json(
        { error: "Invalid priceId format. Must start with 'price_'" },
        { status: 400 }
      );
    }

    console.log("STRIPE_SECRET_KEY (last 8 chars):", process.env.STRIPE_SECRET_KEY?.slice(-8));
    console.log("Received priceId:", priceId);

    if (!stripe) {
      console.error("Stripe client is not initialized");
      return NextResponse.json(
        { error: "Stripe is not configured. Check STRIPE_SECRET_KEY." },
        { status: 500 }
      );
    }

    // Determine mode
    const isPayPerUse = priceId.includes("pay_per_use") || priceId.includes("pay-per-use");
    const mode = isPayPerUse ? "payment" : "subscription";
    console.log("Checkout mode:", mode);

    // Get base URL
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3000";

    // Verify price exists in Stripe before creating session
    let price;
    try {
      price = await stripe.prices.retrieve(priceId);
      console.log("Verified price from Stripe:", price.id, price.unit_amount, price.currency);
    } catch (err: any) {
      console.error("Stripe price retrieval error:", err);
      return NextResponse.json(
        { error: `Price not found in Stripe: ${err.message}` },
        { status: 404 }
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=true`,
      allow_promotion_codes: true,
    });

    if (!session || !session.url) {
      console.error("Stripe session created but no URL returned", session);
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    console.log("Checkout session created:", session.id);
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
