import { NextRequest, NextResponse } from "next/server";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";
import { runEnterpriseEngine } from "@/lib/sandbox/enterpriseEngine";
import { refreshSessionSummary } from "@/lib/sandbox/templateEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    const body = await req.json().catch(() => ({}));
    const sandbox_id = (body.sandbox_id ?? body.sandboxId) as string | undefined;
    if (!sandbox_id) return NextResponse.json({ error: "Missing sandbox_id" }, { status: 400 });
    const result = await runEnterpriseEngine(sandbox_id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    await refreshSessionSummary(sandbox_id);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
