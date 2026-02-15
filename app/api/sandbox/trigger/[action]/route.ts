import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";

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
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  try {
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
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
