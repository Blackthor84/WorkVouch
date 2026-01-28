import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { priceId } = await req.json();

    if (!priceId) {
      return Response.json(
        { error: "priceId is required" },
        { status: 400 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    // Determine origin for success/cancel URLs
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      (req.headers.get("origin") || "http://localhost:3000");

    // Determine mode based on priceId (one_time is payment, others are subscription)
    const isOneTime =
      priceId === process.env.STRIPE_PRICE_ONE_TIME ||
      priceId.includes("one_time") ||
      priceId.includes("one-time");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: isOneTime ? "payment" : "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing/cancel`,
    });

    return Response.json({ url: session.url, id: session.id });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return Response.json(
      { error: err.message || "Stripe session creation failed" },
      { status: 500 }
    );
  }
}

