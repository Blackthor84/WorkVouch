import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/checkout
 * Create a Stripe checkout session for employer subscriptions
 * 
 * IMPORTANT: WorkVouch is ALWAYS FREE for employees.
 * This endpoint only handles employer paid subscriptions.
 * 
 * Environment variables required:
 * - STRIPE_SECRET_KEY: Your Stripe secret key
 * - EMPLOYER_STARTER_PRICE_ID: Stripe price ID for Starter plan
 * - EMPLOYER_TEAM_PRICE_ID: Stripe price ID for Team plan
 * - EMPLOYER_PRO_PRICE_ID: Stripe price ID for Pro plan
 * - EMPLOYER_ENTERPRISE_PRICE_ID: Stripe price ID for Enterprise plan
 * - EMPLOYER_PAY_PER_USE_PRICE_ID: Stripe price ID for Pay-Per-Use plan
 * - EMPLOYER_SECURITY_BUNDLE_PRICE_ID: Stripe price ID for Security Bundle plan
 * 
 * Request body:
 * {
 *   priceId?: string (Stripe price ID - required for employer subscriptions)
 *   tierId?: string (Alternative: tier ID that maps to price ID)
 *   userType?: "employee" | "employer" (for validation)
 *   successUrl?: string (default: /pricing/success)
 *   cancelUrl?: string (default: /pricing)
 *   email?: string (optional, for pre-filling checkout)
 * }
 * 
 * Response:
 * {
 *   url: string (Stripe checkout URL)
 *   sessionId?: string (Stripe session ID)
 *   isFree?: boolean (true if redirected to free signup)
 * }
 */
// Initialize Stripe client
// Note: Use a stable API version. "2025-12-15.clover" may not exist yet.
// Using the latest stable version instead.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10", // Stable API version
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { priceId, tierId, userType, successUrl, cancelUrl, email } = body;

    // Get base URL for redirects
    const baseUrl =
      process.env.NEXT_PUBLIC_URL ||
      process.env.NEXTAUTH_URL ||
      req.nextUrl.origin;

    // Default URLs
    const defaultSuccessUrl = `${baseUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`;
    const defaultCancelUrl = `${baseUrl}/pricing?canceled=true`;

    // ENFORCE: WorkVouch is always free for employees
    // If userType is employee, redirect to free signup (no Stripe checkout)
    if (userType === "employee") {
      return NextResponse.json({
        url: `${baseUrl}/auth/signup?plan=free`,
        isFree: true,
        message: "WorkVouch is always free for employees",
      });
    }

    // Map tier IDs to Stripe price IDs (for employer tiers only)
    const tierPriceMap: Record<string, string> = {
      starter: process.env.EMPLOYER_STARTER_PRICE_ID || "",
      team: process.env.EMPLOYER_TEAM_PRICE_ID || "",
      pro: process.env.EMPLOYER_PRO_PRICE_ID || "",
      enterprise: process.env.EMPLOYER_ENTERPRISE_PRICE_ID || "",
      "pay-per-use": process.env.EMPLOYER_PAY_PER_USE_PRICE_ID || "",
      "security-bundle": process.env.EMPLOYER_SECURITY_BUNDLE_PRICE_ID || "",
    };

    // Determine the final price ID
    let finalPriceId = priceId;

    // If tierId is provided instead of priceId, map it
    if (!finalPriceId && tierId) {
      finalPriceId = tierPriceMap[tierId];
    }

    // Validation: priceId is required for employer subscriptions
    if (!finalPriceId) {
      return NextResponse.json(
        {
          error:
            "Price ID or valid tier ID is required for employer subscriptions",
        },
        { status: 400 }
      );
    }

    // Determine if it's a subscription or one-time payment
    // Pay-per-use is one-time, everything else is subscription
    const isSubscription = tierId !== "pay-per-use" && tierId !== "pay_per_use";

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: isSubscription ? "subscription" : "payment",
      line_items: [{ price: finalPriceId, quantity: 1 }],
      customer_email: email,
      success_url: successUrl || defaultSuccessUrl,
      cancel_url: cancelUrl || defaultCancelUrl,
      metadata: {
        tierId: tierId || "",
        userType: userType || "employer",
        priceId: finalPriceId,
      },
      // Allow promotion codes
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);

    // Handle specific Stripe errors
    if (error.type === "StripeInvalidRequestError") {
      return NextResponse.json(
        { error: `Invalid request: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
