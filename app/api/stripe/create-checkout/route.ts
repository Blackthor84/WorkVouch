import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getCurrentUser, hasRole } from "@/lib/auth";
import {
  stripe,
  STRIPE_PRICE_MAP,
  logMissingStripePriceIds,
  getCheckoutBaseUrl,
} from "@/lib/stripe/config";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isEmployer = await hasRole("employer");
    if (!isEmployer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 },
      );
    }

    const body = await req.json();
    const { planTier } = body; // 'starter', 'team', or 'pro'

    if (!planTier || !["starter", "team", "pro"].includes(planTier)) {
      return NextResponse.json({ error: "Invalid plan tier" }, { status: 400 });
    }

    const priceId = STRIPE_PRICE_MAP[planTier];
    if (!priceId) {
      logMissingStripePriceIds();
      return NextResponse.json(
        { error: "Stripe price ID not configured for this plan. Set STRIPE_PRICE_* in environment." },
        { status: 500 },
      );
    }

    // Feature gate: ensure plan-linked features exist (e.g. pro -> advanced_analytics)
    const adminSupabase = getSupabaseServer() as any;
    if (planTier === "pro") {
      const { data: flag } = await adminSupabase
        .from("feature_flags")
        .select("id")
        .eq("key", "advanced_analytics")
        .maybeSingle();
      if (!flag) {
        return NextResponse.json(
          { error: "Feature advanced_analytics is not configured. Contact support." },
          { status: 503 },
        );
      }
    }

    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;

    // Get employer account
    type EmployerAccountRow = {
      id: string;
      stripe_customer_id: string | null;
      company_name: string;
    };
    const { data: employerAccount, error: employerError } = await supabaseAny
      .from("employer_accounts")
      .select("id, stripe_customer_id, company_name")
      .eq("user_id", user.id)
      .single();

    if (employerError || !employerAccount) {
      return NextResponse.json(
        { error: "Employer not found" },
        { status: 404 },
      );
    }

    const employerAccountTyped = employerAccount as EmployerAccountRow;

    // Get user email from profile
    type ProfileRow = { email: string };
    const { data: profile } = await supabaseAny
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    const profileTyped = profile as ProfileRow | null;

    let customerId = employerAccountTyped.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profileTyped?.email || user.email || "",
        name: employerAccountTyped.company_name,
        metadata: {
          employerId: employerAccountTyped.id,
          userId: user.id,
        },
      });

      customerId = customer.id;

      await supabaseAny
        .from("employer_accounts")
        .update({ stripe_customer_id: customerId })
        .eq("id", employerAccountTyped.id);
    }

    const baseUrl = getCheckoutBaseUrl(req.nextUrl?.origin);

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/employer/dashboard?success=true`,
      cancel_url: `${baseUrl}/employer/dashboard?canceled=true`,
      metadata: {
        employerId: employerAccountTyped.id,
        userId: user.id,
        planTier,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("[Stripe create-checkout]", error?.message ?? error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
