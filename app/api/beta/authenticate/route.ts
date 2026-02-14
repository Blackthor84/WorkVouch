import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;

    // Find user by login token
    const { data: profile, error: profileError } = await supabaseAny
      .from('profiles')
      .select('id, email, beta_expiration, login_token')
      .eq('login_token', token)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Invalid or expired login token" },
        { status: 401 }
      );
    }

    // Check if beta access is expired
    if (profile.beta_expiration) {
      const expirationDate = new Date(profile.beta_expiration);
      if (expirationDate < new Date()) {
        return NextResponse.json(
          { error: "Beta access has expired" },
          { status: 403 }
        );
      }
    }

    // Get user from auth
    const { data: authUser, error: authError } = await supabaseAny.auth.admin.getUserById(profile.id);

    if (authError || !authUser?.user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify user has beta role
    const { data: roles } = await supabaseAny
      .from('user_roles')
      .select('role')
      .eq('user_id', profile.id)
      .eq('role', 'beta');

    if (!roles || roles.length === 0) {
      return NextResponse.json(
        { error: "User does not have beta access" },
        { status: 403 }
      );
    }

    // Return user info for session creation
    // The client will use this to sign in with NextAuth
    return NextResponse.json({
      success: true,
      userId: profile.id,
      email: profile.email,
      role: 'beta',
    });
  } catch (error: any) {
    console.error("Beta authenticate error:", error);
    return NextResponse.json(
      { error: error.message || "Authentication failed" },
      { status: 500 }
    );
  }
}
