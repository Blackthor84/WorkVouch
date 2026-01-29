import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_PRICE_MAP, logMissingStripePriceIds, getCheckoutBaseUrl } from "@/lib/stripe/config";

export async function GET(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured. Please set STRIPE_SECRET_KEY." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const plan = searchParams.get("plan");

    if (!plan) {
      return NextResponse.json(
        { error: "plan parameter is required" },
        { status: 400 }
      );
    }

    const finalPriceId = STRIPE_PRICE_MAP[plan];
    if (!finalPriceId) {
      logMissingStripePriceIds();
      return NextResponse.json(
        { error: `Price ID not configured for plan "${plan}". Set STRIPE_PRICE_* in environment.` },
        { status: 400 }
      );
    }

    const baseUrl = getCheckoutBaseUrl(req.nextUrl?.origin);
    const isSubscription = plan !== "one_time";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: isSubscription ? "subscription" : "payment",
      line_items: [{ price: finalPriceId, quantity: 1 }],
      success_url: `${baseUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      metadata: { tierId: plan, priceId: finalPriceId },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error("[Stripe pricing/checkout GET]", error?.message ?? error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured. Please set STRIPE_SECRET_KEY." },
        { status: 500 }
      );
    }

    const { priceId, tierId, userType, email } = await req.json();

    if (!priceId && !tierId) {
      return NextResponse.json(
        { error: "priceId or tierId is required" },
        { status: 400 }
      );
    }

    if (tierId === "free") {
      const baseUrl = getCheckoutBaseUrl(req.nextUrl?.origin);
      return NextResponse.json({
        url: `${baseUrl}/auth/signup?plan=free`,
        isFree: true,
      });
    }

    if (userType === "employee" && tierId !== "free") {
      return NextResponse.json(
        { error: "WorkVouch is always free for employees. No paid tiers available." },
        { status: 400 }
      );
    }

    const finalPriceId = priceId || STRIPE_PRICE_MAP[tierId];
    if (!finalPriceId) {
      logMissingStripePriceIds();
      return NextResponse.json(
        { error: `Price ID not configured for tier "${tierId}". Set STRIPE_PRICE_* in environment.` },
        { status: 400 }
      );
    }

    const baseUrl = getCheckoutBaseUrl(req.nextUrl?.origin);
    const isSubscription = tierId !== "one_time";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: isSubscription ? "subscription" : "payment",
      line_items: [{ price: finalPriceId, quantity: 1 }],
      customer_email: email,
      success_url: `${baseUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      metadata: { tierId: tierId || "", userType: userType || "", priceId: finalPriceId },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error("[Stripe pricing/checkout POST]", error?.message ?? error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
