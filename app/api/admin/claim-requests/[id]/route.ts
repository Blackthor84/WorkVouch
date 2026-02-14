/**
 * PATCH /api/admin/claim-requests/[id]
 * Approve or reject an employer claim request. On approve: set employer_accounts.user_id, claimed, claim_verified; add employer role.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await hasRole("admin")) && !(await hasRole("superadmin"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const sb = getSupabaseServer() as any;
    const { data: claim, error: fetchErr } = await sb
      .from("employer_claim_requests")
      .select("id, employer_id, requested_by_user_id, status")
      .eq("id", id)
      .single();

    if (fetchErr || !claim) {
      return NextResponse.json({ error: "Claim request not found" }, { status: 404 });
    }

    const row = claim as { status: string; employer_id: string; requested_by_user_id: string };
    if (row.status !== "pending") {
      return NextResponse.json({ error: "Claim request is already processed" }, { status: 400 });
    }

    const action = parsed.data.action;
    const { error: updateClaimErr } = await sb
      .from("employer_claim_requests")
      .update({
        status: action === "approve" ? "approved" : "rejected",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateClaimErr) {
      console.error("[admin/claim-requests] update claim:", updateClaimErr);
      return NextResponse.json({ error: updateClaimErr.message }, { status: 500 });
    }

    if (action === "approve") {
      const { error: updateAccErr } = await sb
        .from("employer_accounts")
        .update({
          user_id: row.requested_by_user_id,
          claimed: true,
          claim_verified: true,
        })
        .eq("id", row.employer_id);

      if (updateAccErr) {
        console.error("[admin/claim-requests] update employer_accounts:", updateAccErr);
        return NextResponse.json({ error: "Failed to assign employer account" }, { status: 500 });
      }

      const { data: existingRole } = await sb
        .from("user_roles")
        .select("id")
        .eq("user_id", row.requested_by_user_id)
        .eq("role", "employer")
        .maybeSingle();

      if (!existingRole) {
        await sb.from("user_roles").insert({
          user_id: row.requested_by_user_id,
          role: "employer",
        });
      }
    }

    return NextResponse.json({ success: true, action });
  } catch (e) {
    console.error("[admin/claim-requests PATCH]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
