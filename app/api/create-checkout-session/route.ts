import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe/config";

// Mark route as dynamic
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Alternative API route that accepts tier names (Basic, Pro, Enterprise)
 * and maps them to Stripe Price IDs.
 * 
 * This route is compatible with the simpler PricingModal implementation.
 * The existing /api/stripe/create-checkout-session route accepts priceId directly.
 */
export async function POST(req: NextRequest) {
  try {
    if (!isStripeConfigured || !stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 },
      );
    }

    const { tier } = await req.json();

    if (!tier) {
      return NextResponse.json(
        { error: "tier is required" },
        { status: 400 },
      );
    }

    // Map tier names to Stripe Price IDs
    // Replace these with your actual Stripe Price IDs from your Stripe dashboard
    const priceMap: Record<string, string> = {
      Basic: process.env.STRIPE_PRICE_BASIC || "price_basic_id",
      Pro: process.env.STRIPE_PRICE_PRO || "price_pro_id",
      Enterprise: process.env.STRIPE_PRICE_ENTERPRISE || "price_enterprise_id",
    };

    const priceId = priceMap[tier as string];

    if (!priceId || priceId.startsWith("price_") === false) {
      return NextResponse.json(
        { error: `Invalid tier: ${tier}. Valid tiers: Basic, Pro, Enterprise` },
        { status: 400 },
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      req.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel`,
      metadata: {
        tier: tier as string,
      },
    });

    // Return session ID for Stripe.js redirectToCheckout
    return NextResponse.json({ id: session.id });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
