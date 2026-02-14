import { NextResponse } from "next/server";


export const runtime = "nodejs";
export async function GET() {
  return NextResponse.json({
    stripeKey: process.env.STRIPE_SECRET_KEY ? "loaded" : "missing",
    stripeLast8: process.env.STRIPE_SECRET_KEY?.slice(-8) || null,

    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    supabaseAnonLast8: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(-8) || null,

    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  });
}
