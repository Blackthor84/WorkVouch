import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getOrigin(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** POST /api/sandbox/trigger/leave-vouch — body: { sandboxId, workerId (reviewer), coworkerId (reviewed), rating?, reviewText? }. Calls same internal service as production; is_sandbox. */
export async function POST(req: NextRequest) {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  try {
    const body = await req.json().catch(() => ({}));
    const sandboxId = body.sandboxId ?? body.sandbox_id;
    const workerId = body.workerId ?? body.reviewer_id;
    const coworkerId = body.coworkerId ?? body.reviewed_id;
    const rating = typeof body.rating === "number" ? body.rating : 4;
    const reviewText = body.reviewText ?? body.review_text ?? "Great teammate.";

    if (!sandboxId || !workerId || !coworkerId) {
      return NextResponse.json(
        { error: "Missing sandboxId, workerId, or coworkerId" },
        { status: 400 }
      );
    }

    const origin = getOrigin(req);
    const cookie = req.headers.get("cookie") ?? "";
    const res = await fetch(`${origin}/api/admin/sandbox-v2/peer-reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({
        sandbox_id: sandboxId,
        reviewer_id: workerId,
        reviewed_id: coworkerId,
        rating,
        review_text: reviewText,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json({ ok: true, review: (data as { review?: unknown }).review });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
