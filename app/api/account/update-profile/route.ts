import { NextResponse } from "next/server";
import { getSupabaseSession } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

/**
 * POST /api/account/update-profile
 * User self-edit: full_name only. Auth required.
 * Email change is NOT allowed here — use POST /api/account/request-email-change (two-step verification).
 */
export async function POST(request: Request) {
  try {
    const { session } = await getSupabaseSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id as string;
    const body = await request.json().catch(() => ({}));
    const full_name = typeof body.full_name === "string" ? body.full_name.trim() : undefined;

    if (full_name !== undefined) {
      if (!full_name || full_name.length < 2) {
        return NextResponse.json({ error: "full_name is required and must be at least 2 characters" }, { status: 400 });
      }
    }

    if (body.email !== undefined) {
      return NextResponse.json(
        { error: "Email cannot be changed here. Use the Change Email flow in Settings." },
        { status: 400 }
      );
    }

    if (full_name === undefined) {
      return NextResponse.json({ success: true });
    }

    const supabase = getServiceRoleClient();
    const supabaseAny = supabase as any;

    const { error: updateError } = await supabaseAny
      .from("profiles")
      .update({ full_name })
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[account/update-profile]", e);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
