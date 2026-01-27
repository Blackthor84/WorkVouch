// app/api/checkout/route.ts
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const { priceId } = body;
    if (!priceId || !priceId.startsWith("price_")) {
      return NextResponse.json({ error: "Invalid or missing priceId" }, { status: 400 });
    }

    if (!stripe) {
      return NextResponse.json({ error: "Stripe not initialized" }, { status: 500 });
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Determine mode
    const isOneTime = priceId.includes("pay_per_use") || priceId.includes("one_time");
    const session = await stripe.checkout.sessions.create({
      mode: isOneTime ? "payment" : "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=true`,
      allow_promotion_codes: true,
    });

    if (!session?.url) {
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    console.log("Checkout session created:", session.id);
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
