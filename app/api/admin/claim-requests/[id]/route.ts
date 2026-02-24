/**
 * PATCH /api/admin/claim-requests/[id]
 * Approve or reject an employer claim request.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdminRoute } from "@/lib/auth/requireAdminRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const supabase = await supabaseServer();

  let user;
  try {
    user = await requireAdminRoute();
  } catch (res) {
    if (res instanceof Response) return res;
    throw res;
  }

  const { id } = await params;
  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const action = body.action;

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("employer_claim_requests")
    .update({
      status: action === "approve" ? "approved" : "rejected",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
