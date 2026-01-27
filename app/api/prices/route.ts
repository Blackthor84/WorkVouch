import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log(
      "Stripe Key Loaded (last 8):",
      process.env.STRIPE_SECRET_KEY?.slice(-8)
    );

    if (!stripe) {
      throw new Error("Stripe client failed to initialize.");
    }

    const prices = await stripe.prices.list({
      active: true,
      limit: 20,
      expand: ["data.product"],
    });

    const formatted = prices.data.map((price) => {
      let productName = "Unknown Product";

      if (
        typeof price.product === "object" &&
        price.product !== null &&
        "name" in price.product
      ) {
        productName = price.product.name;
      }

      return {
        id: price.id,
        unit_amount: price.unit_amount,
        currency: price.currency,
        productName,
        type: price.type,
      };
    });

    console.log("Formatted prices sent to frontend:", formatted);

    return NextResponse.json({ success: true, prices: formatted });
  } catch (err: any) {
    console.error("🔥 Stripe /api/prices ERROR:", err.message, err);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to fetch prices from Stripe. See server logs.",
      },
      { status: 500 }
    );
  }
}
