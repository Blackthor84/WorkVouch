// app/api/prices/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET() {
  try {
    // Fetch all active prices from Stripe
    const prices = await stripe.prices.list({ active: true, limit: 20 });

    // Map Stripe prices to frontend-friendly format
    const formattedPrices = await Promise.all(
      prices.data.map(async (price) => {
        // Fetch product to get a human-readable name
        const product = await stripe.products.retrieve(price.product as string);

        return {
          id: price.id,
          unit_amount: price.unit_amount,
          currency: price.currency,
          productName: product.name,
          type: price.type, // recurring or one_time
        };
      })
    );

    return NextResponse.json({ success: true, prices: formattedPrices });
  } catch (err: any) {
    console.error("Failed to fetch prices from Stripe:", err);
    return NextResponse.json(
      { success: false, error: "Unable to fetch prices from Stripe." },
      { status: 500 }
    );
  }
}
