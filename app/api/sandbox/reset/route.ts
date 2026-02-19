import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getOrigin(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** POST /api/sandbox/reset — delete ALL sandbox data (cascade from sandbox_sessions), then create a new session. Production untouched. */
export async function POST(req: NextRequest) {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  const origin = getOrigin(req);
  const cookie = req.headers.get("cookie") ?? "";

  try {
    const supabase = getServiceRoleClient();
    await supabase.from("abuse_signals").delete().eq("is_sandbox", true);
    const { data: sessions } = await supabase.from("sandbox_sessions").select("id");
    const ids = (sessions ?? []) as { id: string }[];
    if (ids.length > 0) {
      const { error } = await supabase.from("sandbox_sessions").delete().in("id", ids.map((s) => s.id));
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    const createRes = await fetch(`${origin}/api/admin/sandbox-v2/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ name: "Sandbox (reset)" }),
    });
    const data = await createRes.json().catch(() => ({}));
    const sandboxId = (data as { data?: { id?: string } }).data?.id;
    if (!sandboxId) {
      return NextResponse.json(
        { error: (data as { error?: string }).error ?? "Failed to create session" },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, sandboxId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
