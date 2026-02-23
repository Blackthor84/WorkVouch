import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { insertActivityLog } from "@/lib/activity";
import { getEffectiveUserId } from "@/lib/server/effectiveUserId";
import { rejectWriteIfImpersonating } from "@/lib/server/rejectWriteIfImpersonating";

export const runtime = "nodejs";

type Role = "user" | "employer";

/**
 * POST /api/onboarding/complete — mark onboarding complete for effective user.
 * Uses effective user ID (impersonation/sandbox cookies or Supabase auth); does not require auth for impersonated users.
 * Writes are disabled during impersonation.
 */
export async function POST(req: Request) {
  try {
    const reject = await rejectWriteIfImpersonating();
    if (reject) return reject;

    const effectiveUserId = await getEffectiveUserId();
    if (!effectiveUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await supabaseServer();
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
      .eq("id", effectiveUserId);

    if (updateError) {
      return NextResponse.json(
        { error: "Onboarding already completed or not allowed" },
        { status: 403 }
      );
    }

    insertActivityLog({ userId: effectiveUserId, action: "onboarding_completed", metadata: { role } }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
