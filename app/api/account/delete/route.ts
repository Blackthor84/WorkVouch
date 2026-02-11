import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

/**
 * POST /api/account/delete
 * Deletes the current user's account (soft-delete profile + remove auth user).
 * Required for App Store / Google Play.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id as string;

  try {
    const supabase = getServiceRoleClient();
    const supabaseAny = supabase as any;

    // 1) Soft-delete profile (deleted_at)
    const { error: profileError } = await supabaseAny
      .from("profiles")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", userId);

    if (profileError) {
      console.error("[account/delete] Profile soft-delete error:", profileError);
    }

    // 2) Delete auth user (Supabase Admin API)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) {
      console.error("[account/delete] Auth delete error:", authError);
      return NextResponse.json(
        { error: "Failed to delete account. Please contact support." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[account/delete]", err);
    return NextResponse.json(
      { error: "An error occurred. Please try again or contact support." },
      { status: 500 }
    );
  }
}
