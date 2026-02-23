import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { getEffectiveUserId } from "@/lib/server/effectiveUserId";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { insertActivityLog } from "@/lib/activity";
import { rejectWriteIfImpersonating } from "@/lib/server/rejectWriteIfImpersonating";

/**
 * POST /api/account/update-profile
 * User self-edit: full_name only. Auth required. Uses effective user (impersonation-aware).
 * Writes are disabled during impersonation.
 */
export async function POST(request: Request) {
  try {
    const reject = await rejectWriteIfImpersonating();
    if (reject) return reject;

    const userId = await getEffectiveUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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

    insertActivityLog({ userId, action: "profile_updated", metadata: { field: "full_name" } }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[account/update-profile]", e);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
