import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getUser } from "@/lib/auth/getUser";
import { rejectWriteIfImpersonating } from "@/lib/server/rejectWriteIfImpersonating";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const reject = await rejectWriteIfImpersonating();
    if (reject) return reject;

    const user = await getUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: roleRow } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (String((roleRow as { role?: string } | null)?.role ?? "").toLowerCase() === "employer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { count: jobCount } = await admin
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (!jobCount || jobCount < 1) {
      return NextResponse.json({ error: "Add at least one job first" }, { status: 400 });
    }

    const { count: contactCount } = await admin
      .from("worker_onboarding_contacts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    const { count: inviteCount } = await admin
      .from("coworker_invites")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", user.id);

    const c = contactCount ?? 0;
    const i = inviteCount ?? 0;
    if (c < 1 && i < 1) {
      return NextResponse.json(
        { error: "Add at least one coworker or send an invite to continue" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const { error } = await admin
      .from("profiles")
      .update({ worker_onboarding_loop_completed_at: now })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, completedAt: now });
  } catch (e) {
    console.error("[onboarding/vouch/done]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
