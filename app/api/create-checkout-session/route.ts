import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  stripe,
  isStripeConfigured,
  isPriceIdWhitelisted,
  getPriceToTierMap,
  getCheckoutBaseUrl,
} from "@/lib/stripe/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/create-checkout-session
 * Create Stripe subscription checkout session.
 * Body: { priceId } — must be whitelisted. Attaches supabase_user_id to metadata.
 * Success: /dashboard?success=true. Cancel: /pricing?canceled=true. Promotion codes allowed.
 */
export async function POST(req: NextRequest) {
  try {
    if (!isStripeConfigured || !stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const priceId = typeof body?.priceId === "string" ? body.priceId : undefined;

    if (!priceId) {
      return NextResponse.json(
        { error: "priceId is required" },
        { status: 400 },
      );
    }

    if (!isPriceIdWhitelisted(priceId)) {
      return NextResponse.json(
        { error: "Invalid or unconfigured price ID. Use a whitelisted subscription price." },
        { status: 400 },
      );
    }

    const user = await getCurrentUser();
    const supabaseUserId = user?.id ?? null;

    const baseUrl = getCheckoutBaseUrl(req.nextUrl?.origin);
    const successUrl = `${baseUrl}/dashboard?success=true`;
    const cancelUrl = `${baseUrl}/pricing?canceled=true`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        tier: getPriceToTierMap()[priceId] ?? "starter",
        ...(supabaseUserId ? { supabase_user_id: supabaseUserId } : {}),
      },
      ...(supabaseUserId ? { client_reference_id: supabaseUserId } : {}),
    });

    return NextResponse.json({ id: session.id, url: session.url ?? null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create checkout session";
    console.error("[Stripe create-checkout-session]", message);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
