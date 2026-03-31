import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { admin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function resolveEmployerIdForUser(userId: string) {
  const { data, error } = await admin
    .from("employer_accounts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("[api/employer/resume-requests] employer lookup", error.message);
    return null;
  }
  return (data as { id: string } | null)?.id ?? null;
}

/**
 * GET /api/employer/resume-requests — pending and recent resume access requests for this employer.
 */
export async function GET(req: NextRequest) {
  console.log("[API HIT]", req.url);
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      console.warn("[AUTH]", { route: req.url, reason: "no user" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employerId = await resolveEmployerIdForUser(user.id);
    if (!employerId) {
      return NextResponse.json(
        { error: "Employer account required" },
        { status: 403 },
      );
    }

    const { data: rows, error } = await admin
      .from("resume_requests")
      .select("id, candidate_id, status, created_at")
      .eq("employer_id", employerId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      if (
        error.message.includes("does not exist") ||
        error.message.includes("schema cache")
      ) {
        return NextResponse.json({ requests: [] });
      }
      console.error("[DB ERROR]", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const list = rows ?? [];
    const candidateIds = [...new Set(list.map((r) => r.candidate_id))];
    let names: Record<string, string> = {};
    if (candidateIds.length > 0) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, full_name")
        .in("id", candidateIds);
      for (const p of (profiles ?? []) as { id: string; full_name: string | null }[]) {
        names[p.id] = p.full_name ?? "Candidate";
      }
    }

    const requests = list.map((r) => ({
      ...r,
      candidate_name: names[r.candidate_id] ?? "Candidate",
    }));

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("[API ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/employer/resume-requests
 * Body: { candidate_id: uuid }
 */
export async function POST(req: NextRequest) {
  console.log("[API HIT]", req.url);
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      console.warn("[AUTH]", { route: req.url, reason: "no user" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employerId = await resolveEmployerIdForUser(user.id);
    if (!employerId) {
      return NextResponse.json(
        { error: "Employer account required" },
        { status: 403 },
      );
    }

    let body: { candidate_id?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const candidateId =
      typeof body.candidate_id === "string" ? body.candidate_id.trim() : "";
    if (!candidateId || !UUID_RE.test(candidateId)) {
      return NextResponse.json({ error: "Invalid candidate_id" }, { status: 400 });
    }

    if (candidateId === user.id) {
      return NextResponse.json({ error: "Invalid candidate" }, { status: 400 });
    }

    const { data: candidateRow } = await admin
      .from("profiles")
      .select("id")
      .eq("id", candidateId)
      .maybeSingle();
    if (!candidateRow) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const { data: inserted, error } = await admin
      .from("resume_requests")
      .insert({
        employer_id: employerId,
        candidate_id: candidateId,
        status: "pending",
      })
      .select("id, candidate_id, status, created_at")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({
          ok: true,
          duplicate: true,
          message: "You already requested access for this candidate.",
        });
      }
      console.error("[DB ERROR]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, request: inserted });
  } catch (error) {
    console.error("[API ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
