import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    stripeSecretLoaded: !!process.env.STRIPE_SECRET_KEY,
    stripeLast8: process.env.STRIPE_SECRET_KEY
      ? process.env.STRIPE_SECRET_KEY.slice(-8)
      : null,

    supabaseUrlLoaded: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || null,

    supabaseAnonLoaded: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    anonLast8: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(-8)
      : null,

    vercelEnv: process.env.VERCEL_ENV || "unknown",
  });
}
