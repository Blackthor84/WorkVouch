import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Role = "user" | "employer";

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authData.user.id;
    const body = await req.json().catch(() => ({}));
    const role = body?.role as Role | undefined;

    if (role !== "user" && role !== "employer") {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    const supabaseAny = supabase as any;
    const { error: updateError } = await supabaseAny
      .from("profiles")
      .update({
        role,
        onboarding_completed: true,
      })
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json(
        { error: "Onboarding already completed or not allowed" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
