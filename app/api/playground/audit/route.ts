import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getAuthedUser();
    if (!user?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const action = typeof body?.action === "string" ? body.action : "unknown";
    const metadata = body?.metadata && typeof body.metadata === "object" ? body.metadata : {};
    const supabase = await supabaseServer();
    const { error } = await supabase.from("audit_logs").insert({
      actor_id: user.user.id,
      action,
      metadata,
    });
    if (error) {
      console.error("[playground/audit] insert failed", error);
      return NextResponse.json({ error: "Audit failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[playground/audit]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
