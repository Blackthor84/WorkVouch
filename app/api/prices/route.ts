import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

/**
 * GET /api/prices
 * Returns all active Stripe prices with product names.
 * Includes debug logging for troubleshooting.
 */
export async function GET() {
  try {
    // Debug: verify Stripe key is loaded
    const stripeKeyLast8 = process.env.STRIPE_SECRET_KEY?.slice(-8) || "NOT SET";
    console.log("STRIPE_SECRET_KEY (last 8 chars):", stripeKeyLast8);

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Stripe secret key is missing!");
      return NextResponse.json(
        { success: false, error: "Stripe secret key not configured." },
        { status: 500 }
      );
    }

    // Fetch all active prices (up to 100)
    const prices = await stripe.prices.list({ active: true, limit: 100 });
    console.log("Stripe prices fetched:", prices.data.length);

    if (!prices.data || prices.data.length === 0) {
      console.warn("No active prices found in Stripe");
      return NextResponse.json(
        { success: false, error: "No active prices found in Stripe." },
        { status: 404 }
      );
    }

    // Attach product info to each price
    const pricesWithProducts = await Promise.all(
      prices.data.map(async (p) => {
        try {
          const product = await stripe.products.retrieve(p.product.toString());
          return {
            id: p.id,
            unit_amount: p.unit_amount,
            currency: p.currency,
            productName: product.name,
            type: p.type,
          };
        } catch (productErr) {
          console.error(`Failed to fetch product for price ${p.id}:`, productErr);
          return {
            id: p.id,
            unit_amount: p.unit_amount,
            currency: p.currency,
            productName: "UNKNOWN",
            type: p.type,
          };
        }
      })
    );

    console.log("Prices with product info:", pricesWithProducts);
    return NextResponse.json({ success: true, prices: pricesWithProducts });
  } catch (err: any) {
    console.error("Failed to fetch prices:", err);
    return NextResponse.json(
      { success: false, error: "Unable to fetch prices from Stripe" },
      { status: 500 }
    );
  }
}
