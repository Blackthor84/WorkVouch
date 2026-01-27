// app/api/checkout/route.ts
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1️⃣ Parse request body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { priceId } = body;

    // 2️⃣ Validate priceId
    if (!priceId || typeof priceId !== "string" || !priceId.startsWith("price_")) {
      return NextResponse.json(
        { error: "Invalid priceId. Must be a string starting with 'price_'" },
        { status: 400 }
      );
    }

    // 3️⃣ Check Stripe client
    if (!stripe) {
      console.error("Stripe client not initialized. Check STRIPE_SECRET_KEY.");
      return NextResponse.json(
        { error: "Stripe is not configured. Contact admin." },
        { status: 500 }
      );
    }

    // 4️⃣ Determine mode
    const isPayPerUse = priceId.includes("pay_per_use") || priceId.includes("pay-per-use");
    const mode = isPayPerUse ? "payment" : "subscription";

    // 5️⃣ Determine base URL
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3000";

    // 6️⃣ Create Stripe Checkout session
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pricing?canceled=true`,
        allow_promotion_codes: true,
      });
    } catch (stripeError: any) {
      console.error("Stripe API Error:", stripeError);
      return NextResponse.json(
        { error: `Stripe API Error: ${stripeError.message}` },
        { status: 500 }
      );
    }

    if (!session?.url) {
      console.error("Stripe session created but no URL returned", session);
      return NextResponse.json(
        { error: "Failed to create Stripe checkout session" },
        { status: 500 }
      );
    }

    // 7️⃣ Return session URL
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Unexpected Checkout Error:", err);
    return NextResponse.json(
      { error: err.message || "Unexpected error occurred" },
      { status: 500 }
    );
  }
}
