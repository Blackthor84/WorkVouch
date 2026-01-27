import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

/**
 * Stripe Checkout API Route
 * 
 * Creates a Stripe Checkout session for subscription or one-time payment.
 * 
 * POST /api/checkout
 * Body: { priceId: string }
 * 
 * Returns: { url: string } - The Stripe Checkout URL
 */
export async function POST(req: Request) {
  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
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

    // Validate priceId format (should start with "price_")
    if (!priceId.startsWith("price_")) {
      return NextResponse.json(
        { error: "Invalid priceId format. Must start with 'price_'" },
        { status: 400 }
      );
    }

    // Check if Stripe is configured
    if (!stripe) {
      console.error("Stripe client is not initialized");
      return NextResponse.json(
        { error: "Stripe is not configured. Please check STRIPE_SECRET_KEY environment variable." },
        { status: 500 }
      );
    }

    // Determine checkout mode based on priceId
    // Pay-per-use reports are one-time payments, others are subscriptions
    const isPayPerUse = priceId.includes("pay_per_use") || priceId.includes("pay-per-use");
    const mode = isPayPerUse ? "payment" : "subscription";

    // Get base URL from environment variables
    const origin = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXT_PUBLIC_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   "http://localhost:3000";

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=true`,
      // Allow promotion codes
      allow_promotion_codes: true,
    });

    // Validate session was created
    if (!session || !session.url) {
      console.error("Stripe session created but no URL returned", session);
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    // Handle Stripe-specific errors
    if (err.type === "StripeInvalidRequestError") {
      console.error("Stripe API Error:", err.message);
      return NextResponse.json(
        { error: `Invalid Stripe request: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle other errors
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
