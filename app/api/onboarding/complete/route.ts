import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/onboarding/complete — mark onboarding_completed for the current user.
 * Called when user completes or skips the onboarding overlay.
 */
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await supabaseServer();
    const supabaseAny = supabase as any;
    const { error } = await supabaseAny
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", user.id);

    if (error) {
      console.error("[onboarding/complete]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[onboarding/complete]", e);
    return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
  }
}
