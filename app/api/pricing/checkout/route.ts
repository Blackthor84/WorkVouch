import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

export async function POST(req: NextRequest) {
  try {
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

    // Map tier IDs to Stripe price IDs if tierId is provided
    const tierPriceMap: Record<string, string> = {
      // Employee tiers - only free is allowed
      // Employer tiers
      "starter": process.env.STRIPE_PRICE_STARTER || process.env.STRIPE_PRICE_BASIC || "",
      "team": process.env.STRIPE_PRICE_TEAM || process.env.STRIPE_PRICE_PRO || "",
      "pro": process.env.STRIPE_PRICE_PRO || process.env.STRIPE_PRICE_ENTERPRISE || "",
      "pay-per-use": process.env.STRIPE_PRICE_PAY_PER_USE || "",
      "security-bundle": process.env.STRIPE_PRICE_SECURITY_BUNDLE || "",
    };

    const finalPriceId = priceId || tierPriceMap[tierId];

    if (!finalPriceId) {
      return NextResponse.json(
        { error: `No Stripe price ID configured for tier: ${tierId}` },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_URL ||
      process.env.NEXTAUTH_URL ||
      req.nextUrl.origin;

    // Determine if it's a subscription or one-time payment
    const isSubscription = tierId !== "pay-per-use";

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
