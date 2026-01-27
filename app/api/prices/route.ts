import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET() {
  try {
    // Fetch all active prices (set limit high enough to include all)
    const prices = await stripe.prices.list({ active: true, limit: 20 });

    // Optional: fetch product info for display
    const pricesWithProducts = await Promise.all(
      prices.data.map(async (price) => {
        const product = await stripe.products.retrieve(price.product.toString());
        return { ...price, productName: product.name };
      })
    );

    console.log("Fetched Stripe prices:", pricesWithProducts.map(p => p.id));

    return NextResponse.json({ success: true, prices: pricesWithProducts });
  } catch (err: any) {
    console.error("Error fetching prices:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
