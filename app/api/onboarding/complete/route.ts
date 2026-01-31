import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;

    const { error } = await supabaseAny
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", user.id);

    if (error) {
      // Column may not exist yet
      if (error.code === "42703") {
        return NextResponse.json({ ok: true });
      }
      console.error("[onboarding/complete]", error);
      return NextResponse.json(
        { error: error.message || "Failed to save" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[onboarding/complete]", e);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
