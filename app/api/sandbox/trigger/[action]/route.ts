import { NextRequest, NextResponse } from "next/server";
import { requireSandboxMode } from "@/lib/sandbox/apiGuard";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STUB_ACTIONS = new Set([
  "complete-profile",
  "submit-culture",
  "flag-dispute",
  "confirm-coworker",
  "flag-fraud",
]);

/** POST /api/sandbox/trigger/[action] — complete-profile | leave-vouch | submit-culture | flag-dispute | confirm-coworker | flag-fraud. leave-vouch is at /api/sandbox/trigger/leave-vouch. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const guard = requireSandboxMode();
  if (guard) return guard;

  try {
    await requireSandboxV2Admin();
    const { action } = await params;
    const normalized = action?.toLowerCase().replace(/_/g, "-") ?? "";

    if (normalized === "leave-vouch") {
      return NextResponse.json(
        { error: "Use POST /api/sandbox/trigger/leave-vouch with body { sandboxId, workerId, coworkerId }" },
        { status: 400 }
      );
    }

    if (STUB_ACTIONS.has(normalized)) {
      return NextResponse.json({ ok: true, action: normalized });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 404 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "Forbidden: admin or super_admin required") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
