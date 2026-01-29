import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeConfigured, STRIPE_PRICE_MAP, logMissingStripePriceIds, getCheckoutBaseUrl } from "@/lib/stripe/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Maps tier display names to canonical tier keys for STRIPE_PRICE_MAP */
const tierKeyMap: Record<string, string> = {
  Basic: "starter",
  Pro: "pro",
  Starter: "starter",
  Team: "team",
  "Security Bundle": "security",
};

export async function POST(req: NextRequest) {
  try {
    if (!isStripeConfigured || !stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 },
      );
    }

    const { tier } = await req.json();

    if (!tier || typeof tier !== "string") {
      return NextResponse.json(
        { error: "tier is required" },
        { status: 400 },
      );
    }

    const tierKey = tierKeyMap[tier] ?? tier.toLowerCase();
    const priceId = STRIPE_PRICE_MAP[tierKey];

    if (!priceId) {
      logMissingStripePriceIds();
      return NextResponse.json(
        { error: `Price ID not configured for tier "${tier}". Set STRIPE_PRICE_* in environment.` },
        { status: 400 },
      );
    }

    const baseUrl = getCheckoutBaseUrl(req.nextUrl?.origin);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      metadata: { tier: tierKey },
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error("[Stripe create-checkout-session]", error?.message ?? error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
