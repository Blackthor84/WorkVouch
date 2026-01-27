import { AD_PRICING } from "@/lib/ads/pricing";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 }
      );
    }

    // Check admin access
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'admin' || session?.user?.roles?.includes('admin') || session?.user?.roles?.includes('superadmin');
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { adType, employerId } = await req.json();

    const priceItem = AD_PRICING.find((p) => p.id === adType);
    if (!priceItem) {
      return NextResponse.json({ error: "Invalid ad type" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const session_stripe = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${baseUrl}/admin/ads/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/admin/ads/cancel`,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: priceItem.label,
              description: `${priceItem.durationDays} days, ${priceItem.impressions} impressions`,
            },
            unit_amount: priceItem.price * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        employerId: employerId || 'ADMIN_PURCHASE',
        adType,
        price: priceItem.price.toString(),
        duration: priceItem.durationDays.toString(),
        userId: session?.user?.id || '',
      },
    });

    return NextResponse.json({ url: session_stripe.url, sessionId: session_stripe.id });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: error.message || "Checkout failed" }, { status: 500 });
  }
}
