// /api/prices.ts
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 }
      );
    }

    const prices = await stripe.prices.list({ 
      active: true, 
      expand: ["data.product"] 
    });
    
    return NextResponse.json(prices.data);
  } catch (err: any) {
    console.error("Error fetching prices:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch prices" },
      { status: 500 }
    );
  }
}
