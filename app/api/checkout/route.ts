import { stripe, STRIPE_PRICE_ONE_TIME, logMissingStripePriceIds, getCheckoutBaseUrl } from "@/lib/stripe/config";

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

    if (!stripe) {
      return Response.json(
        { error: "Stripe is not configured. Please set STRIPE_SECRET_KEY." },
        { status: 500 }
      );
    }

    const baseUrl = getCheckoutBaseUrl(req.headers.get("origin"));
    const isOneTime =
      priceId === STRIPE_PRICE_ONE_TIME ||
      String(priceId).includes("one_time") ||
      String(priceId).includes("one-time");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: isOneTime ? "payment" : "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing/cancel`,
    });

    return Response.json({ url: session.url, id: session.id });
  } catch (err: any) {
    console.error("[Stripe checkout]", err?.message ?? err);
    return Response.json(
      { error: err?.message ?? "Stripe session creation failed" },
      { status: 500 }
    );
  }
}

