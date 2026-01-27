import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function GET() {
  try {
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

    return NextResponse.json({ success: true, prices: formatted });
  } catch (err: any) {
    // Return success:false instead of throwing 500 error
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Unable to fetch prices from Stripe",
      },
      { status: 200 } // Return 200 with success:false to prevent page crash
    );
  }
}
