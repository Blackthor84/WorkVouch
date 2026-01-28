import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

// Map tier IDs to Stripe price IDs - canonical names only, no fallbacks
const priceMap: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || "",
  team: process.env.STRIPE_PRICE_TEAM || "",
  pro: process.env.STRIPE_PRICE_PRO || "",
  security: process.env.STRIPE_PRICE_SECURITY || "",
  one_time: process.env.STRIPE_PRICE_ONE_TIME || "",
};

export async function GET(req: NextRequest) {
  try {
    // Validate Stripe is configured
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

    const finalPriceId = priceMap[plan];

    if (!finalPriceId) {
      return NextResponse.json(
        { error: "Price ID not configured" },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_URL ||
      process.env.NEXTAUTH_URL ||
      req.nextUrl.origin;

    // Determine if it's a subscription or one-time payment
    const isSubscription = plan !== "one_time";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: isSubscription ? "subscription" : "payment",
      line_items: [{ price: finalPriceId, quantity: 1 }],
      success_url: `${baseUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      metadata: {
        tierId: plan,
        priceId: finalPriceId,
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error("Pricing checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Validate Stripe is configured
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

    // Free plan should redirect to signup, not create a checkout session
    if (tierId === "free") {
      const baseUrl =
        process.env.NEXT_PUBLIC_URL ||
        process.env.NEXTAUTH_URL ||
        req.nextUrl.origin;
      return NextResponse.json({
        url: `${baseUrl}/auth/signup?plan=free`,
        isFree: true,
      });
    }

    // Block any employee paid tiers (WorkVouch is free for employees)
    if (userType === "employee" && tierId !== "free") {
      return NextResponse.json(
        { error: "WorkVouch is always free for employees. No paid tiers available." },
        { status: 400 }
      );
    }

    const finalPriceId = priceId || priceMap[tierId];

    if (!finalPriceId) {
      return NextResponse.json(
        { error: "Price ID not configured" },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_URL ||
      process.env.NEXTAUTH_URL ||
      req.nextUrl.origin;

    // Determine if it's a subscription or one-time payment
    const isSubscription = tierId !== "one_time";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: isSubscription ? "subscription" : "payment",
      line_items: [{ price: finalPriceId, quantity: 1 }],
      customer_email: email,
      success_url: `${baseUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      metadata: {
        tierId: tierId || "",
        userType: userType || "",
        priceId: finalPriceId,
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error("Pricing checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
