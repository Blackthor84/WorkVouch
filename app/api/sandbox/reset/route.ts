import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getOrigin(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** POST /api/sandbox/reset — create a new sandbox session (start fresh). Returns new sandboxId. */
export async function POST(req: NextRequest) {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  const origin = getOrigin(req);
  const cookie = req.headers.get("cookie") ?? "";

  try {
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
