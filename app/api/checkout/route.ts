import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

/**
 * Stripe Checkout API Route
 * Handles all pricing tiers including Free ($0)
 */
export async function POST(req: Request) {
  try {
    // Parse request body
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

    // Handle Free Tier ($0) without Stripe
    if (priceId === "free") {
      // Here, you would upgrade the user in your database directly
      console.log("Free tier selected. No Stripe checkout required.");
      return NextResponse.json({ url: "/pricing/success?free=true" });
    }

    // Ensure Stripe client exists
    if (!stripe) {
      console.error("Stripe client is not initialized");
      return NextResponse.json(
        { error: "Stripe is not configured. Check STRIPE_SECRET_KEY." },
        { status: 500 }
      );
    }

    // Verify the price exists in Stripe
    const stripePrice = await stripe.prices.retrieve(priceId).catch(() => null);
    if (!stripePrice || !stripePrice.active) {
      console.error("Price not found or inactive in Stripe:", priceId);
      return NextResponse.json(
        { error: "Price not found in Stripe" },
        { status: 404 }
      );
    }

    // Determine checkout mode (subscription vs one-time)
    const mode = stripePrice.type === "recurring" ? "subscription" : "payment";

    // Determine origin for redirect URLs
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
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
      allow_promotion_codes: true,
    });

    // Ensure session was created
    if (!session || !session.url) {
      console.error("Stripe session created but no URL returned", session);
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
