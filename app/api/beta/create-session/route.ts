import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json();

    if (!userId || !email) {
      return NextResponse.json({ error: "User ID and email are required" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const supabaseAny = supabase as any;

    // Verify user has beta role
    const { data: roles } = await supabaseAny
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'beta');

    if (!roles || roles.length === 0) {
      return NextResponse.json(
        { error: "User does not have beta access" },
        { status: 403 }
      );
    }

    // Check if beta access is expired
    const { data: profile } = await supabaseAny
      .from('profiles')
      .select('beta_expiration')
      .eq('id', userId)
      .single();

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
