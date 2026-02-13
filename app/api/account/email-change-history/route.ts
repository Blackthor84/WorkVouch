import { NextResponse } from "next/server";
import { getSupabaseSession } from "@/lib/supabase/server";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * GET /api/account/email-change-history
 * Returns email_change_history for the current user (for Settings display).
 */
export async function GET() {
  try {
    const { session } = await getSupabaseSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id as string;

    const supabase = await createServerSupabase();
    const { data, error } = await (supabase as any)
      .from("email_change_history")
      .select("id, previous_email, new_email, changed_by, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[email-change-history] select failed:", error);
      return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("[email-change-history]", e);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
