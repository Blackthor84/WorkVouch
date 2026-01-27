// app/api/stripe/test/route.ts
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    if (!stripe) {
      console.error("Stripe client not initialized. Check STRIPE_SECRET_KEY.");
      return NextResponse.json(
        { success: false, error: "Stripe is not configured. Contact admin." },
        { status: 500 }
      );
    }

    // Test: List prices from your Stripe account (default limit: 10)
    const limit = 10;
    const prices = await stripe.prices.list({ limit });

    if (!prices || !prices.data) {
      console.error("Stripe returned no prices", prices);
      return NextResponse.json(
        { success: false, error: "Failed to fetch prices" },
        { status: 500 }
      );
    }

    console.log(`Stripe test successful. Prices fetched: ${prices.data.length} (limit: ${limit})`);
    return NextResponse.json({ success: true, prices: prices.data });
  } catch (err: any) {
    console.error("Stripe Test Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Unexpected Stripe error" },
      { status: 500 }
    );
  }
}
