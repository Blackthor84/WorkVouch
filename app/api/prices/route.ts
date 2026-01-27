// app/api/prices/route.ts
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Debug: check Stripe key
    console.log("STRIPE_SECRET_KEY last 8:", process.env.STRIPE_SECRET_KEY?.slice(-8));

    if (!stripe) {
      throw new Error("Stripe client not initialized. Check STRIPE_SECRET_KEY.");
    }

    // Fetch all active prices
    const prices = await stripe.prices.list({
      limit: 10,       // fetch all prices
      active: true,
      expand: ["data.product"]
    });

    // Format prices for frontend
    const formatted = prices.data.map(p => {
      let productName: string;
      if (typeof p.product === "object" && p.product !== null && "name" in p.product) {
        productName = p.product.name;
      } else if (typeof p.product === "string") {
        productName = p.product;
      } else {
        productName = "Unknown Product";
      }

      return {
        id: p.id,
        unit_amount: p.unit_amount,
        currency: p.currency,
        productName,
        type: p.type, // recurring or one_time
      };
    });

    console.log("Formatted prices:", formatted);

    return NextResponse.json({ success: true, prices: formatted });
  } catch (err: any) {
    console.error("Error fetching prices:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Unable to fetch prices from Stripe" },
      { status: 500 }
    );
  }
}
