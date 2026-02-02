import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe/config";
import { getSupabaseServer } from "@/lib/supabase/admin";

// Mark route as dynamic
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!isStripeConfigured || !stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 },
      );
    }

    const { priceId, email, userId, userType } = await req.json();

    if (!priceId) {
      return NextResponse.json(
        { error: "priceId is required" },
        { status: 400 },
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      req.nextUrl.origin;

    const metadata: Record<string, string> = {
      priceId: priceId,
    };
    if (userId) metadata.userId = userId;
    if (userType) metadata.userType = userType;

    if (userId) {
      const supabase = getSupabaseServer();
      const { data: employer } = await supabase
        .from("employer_accounts")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      if (employer?.id) metadata.employerId = employer.id;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      success_url: `${baseUrl}/employer/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata,
    });

    // Return both URL and session ID for Stripe.js redirectToCheckout
    return NextResponse.json({ 
      url: session.url,
      id: session.id,
    });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
