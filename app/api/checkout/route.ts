import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1️⃣ Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("Invalid JSON:", parseError);
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const { priceId } = body;

    // 2️⃣ Validate priceId
    if (!priceId || typeof priceId !== "string") {
      console.error("Missing or invalid priceId:", priceId);
      return NextResponse.json({ error: "priceId is required and must be a string" }, { status: 400 });
    }

    // 3️⃣ Ensure Stripe is initialized
    if (!stripe) {
      console.error("Stripe client not initialized. Check STRIPE_SECRET_KEY");
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
    }

    // 4️⃣ Fetch the price from Stripe to verify it exists
    let price;
    try {
      price = await stripe.prices.retrieve(priceId);
    } catch (err) {
      console.error("Failed to retrieve price from Stripe:", err);
      return NextResponse.json({ error: "Price not found in Stripe" }, { status: 400 });
    }

    if (!price.active) {
      console.error("Price is inactive:", price);
      return NextResponse.json({ error: "This price is inactive" }, { status: 400 });
    }

    // 5️⃣ Detect mode automatically
    const mode = price.type === "recurring" ? "subscription" : "payment";

    // 6️⃣ Build URLs
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    // 7️⃣ Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=true`,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      console.error("Stripe session created but no URL returned", session);
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    console.log("Stripe checkout session created:", session.id);
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json({ error: err.message || "Unexpected error" }, { status: 500 });
  }
}
