import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseSession } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json();

    if (!userId || !email) {
      return NextResponse.json({ error: "User ID and email are required" }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;

    // Verify user has beta access and check expiration
    const { data: profile } = await supabaseAny
      .from('profiles')
      .select('role, beta_expiration')
      .eq('id', userId)
      .single();

    const hasBeta = (profile as { role?: string })?.role === "beta" || (profile as { beta_expiration?: string })?.beta_expiration;
    if (!hasBeta) {
      return NextResponse.json(
        { error: "User does not have beta access" },
        { status: 403 }
      );
    }

    if (profile?.beta_expiration) {
      const expirationDate = new Date(profile.beta_expiration);
      if (expirationDate < new Date()) {
        return NextResponse.json(
          { error: "Beta access has expired" },
          { status: 403 }
        );
      }
    }

    // Return success - the client will handle NextAuth sign-in
    // For now, we'll use a cookie-based approach or redirect
    return NextResponse.json({
      success: true,
      userId,
      email,
      role: 'beta',
      message: "Beta session created",
    });
  } catch (error: any) {
    console.error("Create beta session error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create session" },
      { status: 500 }
    );
  }
}
