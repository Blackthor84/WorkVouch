import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/sandbox/spawn — ENV === SANDBOX + ADMIN only. Cookies required (credentials: "include"). */
export async function POST(req: NextRequest) {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  const body = await req.json().catch(() => ({}));
  const type = (body.type as string)?.toLowerCase();
  if (type && !["worker", "employer", "pair", "team"].includes(type)) {
    return NextResponse.json({ error: "Invalid type. Use worker | employer | pair | team" }, { status: 400 });
  }

  // TODO: real spawn logic can live here (generate-employee/employer, audit log, is_sandbox = true)
  return NextResponse.json({ ok: true });
}
