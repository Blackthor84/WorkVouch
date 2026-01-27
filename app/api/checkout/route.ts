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
    // Validate environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("[Checkout] STRIPE_SECRET_KEY is not defined");
      return NextResponse.json(
        { error: "Stripe is not configured. STRIPE_SECRET_KEY is missing." },
        { status: 500 }
      );
    }

    // Parse request body safely
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }

    const { priceId } = body;

    // Validate priceId
    if (!priceId || typeof priceId !== "string") {
      return NextResponse.json(
        { error: "priceId is required" },
        { status: 400 }
      );
    }

    // Get base URL from environment variables with fallback
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!process.env.NEXT_PUBLIC_APP_URL && process.env.NODE_ENV === "production") {
      console.warn("[Checkout] NEXT_PUBLIC_APP_URL is not set in production. Using localhost fallback.");
    }

    // Determine checkout mode based on priceId
    // Pay-per-use reports are one-time payments, others are subscriptions
    const mode = priceId.includes("pay_per_use") || priceId.includes("pay-per-use")
      ? "payment"
      : "subscription";

    // Create Stripe Checkout session with error handling
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pricing?canceled=true`,
        allow_promotion_codes: true,
      });
    } catch (stripeError: any) {
      console.error("[Checkout] Stripe API Error:", {
        type: stripeError.type,
        message: stripeError.message,
        code: stripeError.code,
        priceId,
      });
      
      if (stripeError.type === "StripeInvalidRequestError") {
        return NextResponse.json(
          { error: `Invalid Stripe request: ${stripeError.message}` },
          { status: 400 }
        );
      }
      
      throw stripeError; // Re-throw to be caught by outer catch
    }

    // Validate session was created with URL
    if (!session || !session.url) {
      console.error("[Checkout] Stripe session created but URL missing:", {
        sessionId: session?.id,
        hasUrl: !!session?.url,
      });
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    console.log("[Checkout] Session created successfully:", {
      sessionId: session.id,
      mode,
      priceId,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    // Handle unexpected errors
    console.error("[Checkout] Unexpected error:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });
    
    return NextResponse.json(
      { error: err.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
