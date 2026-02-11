import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * POST /api/account/update-profile
 * User self-edit: full_name, email only. Auth required.
 * On email change: update auth, set email_verified=false, log audit, optional verification email.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id as string;
    const body = await request.json();
    const full_name = typeof body.full_name === "string" ? body.full_name.trim() : undefined;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : undefined;
    const current_password = typeof body.current_password === "string" ? body.current_password : undefined;

    if (full_name !== undefined) {
      if (!full_name || full_name.length < 2) {
        return NextResponse.json({ error: "full_name is required and must be at least 2 characters" }, { status: 400 });
      }
    }
    if (email !== undefined && !validateEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    const supabaseAny = supabase as any;

    // Load current profile
    const { data: currentProfile, error: fetchError } = await supabaseAny
      .from("profiles")
      .select("id, full_name, email, email_verified")
      .eq("id", userId)
      .single();

    if (fetchError || !currentProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const currentEmail = (currentProfile.email ?? "").trim().toLowerCase();
    const emailChanging = email !== undefined && email !== currentEmail;

    if (emailChanging) {
      if (!current_password) {
        return NextResponse.json({ error: "current_password is required to change email" }, { status: 400 });
      }
      // Re-auth: verify current password (sign in with current email + password)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentEmail || (session.user as { email?: string }).email,
        password: current_password,
      });
      if (signInError) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      // Check email not already taken
      const { data: existing } = await supabaseAny
        .from("profiles")
        .select("id")
        .eq("email", email)
        .neq("id", userId)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ error: "Email is already in use by another account" }, { status: 400 });
      }
    }

    const updates: Record<string, unknown> = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (email !== undefined) updates.email = email;
    if (emailChanging) updates.email_verified = false;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true });
    }

    if (emailChanging) {
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, { email });
      if (authError) {
        return NextResponse.json({ error: "Failed to update email. Please try again." }, { status: 500 });
      }
    }

    const { error: updateError } = await supabaseAny
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    if (emailChanging) {
      await supabaseAny.from("admin_audit_logs").insert({
        admin_id: userId,
        target_user_id: userId,
        action: "user_email_change",
        old_value: { email: currentEmail },
        new_value: { email },
        reason: "User self-service email change",
      });
      // TODO: send verification email (e.g. Supabase generateLink + Resend) when email provider is configured
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[account/update-profile]", e);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
