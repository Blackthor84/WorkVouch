import { NextResponse } from "next/server";
import { stripe, isStripeConfigured, getCheckoutBaseUrl } from "@/lib/stripe/config";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/create-portal-session
 * Create Stripe Billing Portal session. Get logged-in user; retrieve stripe_customer_id
 * from employer_accounts first, then profiles. Return portal URL.
 */
export async function POST() {
  try {
    if (!isStripeConfigured || !stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
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

    const sb = getSupabaseServer() as any;

    const { data: employer } = await sb
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

    const { data: profile } = await sb
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
    console.error("[create-portal-session]", message);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
