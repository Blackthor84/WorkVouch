import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser, getCurrentUserRole } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { createServerSupabase } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = await getCurrentUserRole();
    if (!isAdmin(role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, expirationDays } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;

    // Generate unique login token
    const loginToken = crypto.randomBytes(32).toString('hex');

    // Calculate expiration date (default 7 days)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + (expirationDays || 7));

    // Check if user already exists
    const { data: existingUser } = await supabaseAny.auth.admin.getUserByEmail(email);

    let userId: string;

    if (existingUser?.user) {
      // User exists, update their profile
      userId = existingUser.user.id;
      
      // Update profile with beta fields
      await supabaseAny
        .from('profiles')
        .update({
          beta_expiration: expirationDate.toISOString(),
          login_token: loginToken,
        })
        .eq('id', userId);
    } else {
      // Create new user in Supabase Auth
      const { data: newUser, error: createError } = await supabaseAny.auth.admin.createUser({
        email,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          role: 'beta',
        },
      });

      if (createError || !newUser?.user) {
        return NextResponse.json(
          { error: createError?.message || "Failed to create user" },
          { status: 500 }
        );
      }

      userId = newUser.user.id;

      // Create profile with beta fields
      await supabaseAny
        .from('profiles')
        .upsert({
          id: userId,
          email,
          beta_expiration: expirationDate.toISOString(),
          login_token: loginToken,
        }, {
          onConflict: 'id',
        });
    }

    // Generate login URL
    const baseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const loginUrl = `${baseUrl}/beta-login?token=${loginToken}`;

    // TODO: Send email with login link
    // For now, return the URL so admin can copy it
    // You can integrate SendGrid or another email service here

    return NextResponse.json({
      success: true,
      userId,
      loginUrl,
      expirationDate: expirationDate.toISOString(),
      message: "Beta access created successfully. Share the login URL with the user.",
    });
  } catch (error: any) {
    console.error("Create beta access error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create beta access" },
      { status: 500 }
    );
  }
}
