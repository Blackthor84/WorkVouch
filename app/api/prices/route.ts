import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const prices = await stripe.prices.list({
      active: true,
      limit: 20,
      expand: ["data.product"],
    });

    const formatted = prices.data.map((p) => ({
      id: p.id,
      unit_amount: p.unit_amount,
      currency: p.currency,
      productName:
        typeof p.product === "object" && p.product && "name" in p.product
          ? p.product.name
          : "Unknown Product",
      type: p.type,
    }));

    return NextResponse.json({ success: true, prices: formatted });
  } catch (err: any) {
    console.error("STRIPE PRICE ERROR:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
