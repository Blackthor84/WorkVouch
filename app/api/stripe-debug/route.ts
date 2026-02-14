import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";


export const runtime = "nodejs";
export async function GET() {
  try {
    const prices = await stripe.prices.list({
      active: true,
      limit: 10,
    });

    return NextResponse.json({
      ok: true,
      count: prices.data.length,
      ids: prices.data.map(p => p.id),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
