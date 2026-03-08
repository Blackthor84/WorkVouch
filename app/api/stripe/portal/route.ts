// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

import { NextResponse } from "next/server";
import { stripe, isStripeConfigured, getCheckoutBaseUrl } from "@/lib/stripe/config";
import { admin } from "@/lib/supabase-admin";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Create Stripe Billing Portal Session
 * POST /api/stripe/portal
 * Gets logged-in user; retrieves stripe_customer_id from employer_accounts first, then profiles.
 * Returns portal URL for managing subscription, payment methods, billing.
 */
export async function POST() {
  try {
    if (!isStripeConfigured || !stripe) {
      return NextResponse.json(
        {
          error:
            "Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.",
        },
        { status: 503 },
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "User not signed in" },
        { status: 401 },
      );
    }
    // Try employer_accounts first (employer subscription)
    const { data: employer } = await admin
      .from("employer_accounts")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const employerCustomerId = (employer as { stripe_customer_id?: string | null } | null)?.stripe_customer_id ?? null;

    if (employerCustomerId) {
      const baseUrl = getCheckoutBaseUrl();
      const portal = await stripe.billingPortal.sessions.create({
        customer: employerCustomerId,
        return_url: `${baseUrl}/dashboard`,
      });
      return NextResponse.json({ url: portal.url ?? null });
    }

    // Fallback: profiles (e.g. employee or legacy)
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    const profileCustomerId = (profile as { stripe_customer_id?: string | null } | null)?.stripe_customer_id ?? null;

    if (!profileCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer found. Please subscribe first." },
        { status: 400 },
      );
    }

    const baseUrl = getCheckoutBaseUrl();
    const portal = await stripe.billingPortal.sessions.create({
      customer: profileCustomerId,
      return_url: `${baseUrl}/dashboard`,
    });

    return NextResponse.json({ url: portal.url ?? null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create portal session";
    console.error("Stripe portal error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
