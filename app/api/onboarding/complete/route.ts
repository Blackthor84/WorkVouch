import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/onboarding/complete — set onboarding_completed = true for the current user.
 * Idempotent; safe to call multiple times. Updates only the authenticated user.
 */
export async function POST() {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAny = supabase as any;
    const { data, error } = await supabaseAny
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", user.id)
      .select("id");

    if (error) {
      return NextResponse.json(
        { error: "Failed to update onboarding" },
        { status: 500 }
      );
    }

    const updated = Array.isArray(data) ? data.length > 0 : data != null;
    if (!updated) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
