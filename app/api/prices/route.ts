import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    if (!stripe) {
      return NextResponse.json(
        { success: false, error: "Stripe is not configured" },
        { status: 500 }
      );
    }

    const prices = await stripe.prices.list({ 
      active: true, 
      limit: 100,
      expand: ["data.product"] 
    });
    
    return NextResponse.json({ success: true, prices: prices.data });
  } catch (err: any) {
    console.error("Failed to fetch Stripe prices:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch prices" },
      { status: 500 }
    );
  }
}
