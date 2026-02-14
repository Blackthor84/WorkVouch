import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { ComplianceDisputeStatus } from "@/lib/compliance-types";
import type { Database } from "@/types/supabase";
import { z } from "zod";

type ComplianceDisputeUpdate = Database["public"]["Tables"]["compliance_disputes"]["Update"];

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  status: z
    .enum([
      ComplianceDisputeStatus.Pending,
      ComplianceDisputeStatus.UnderReview,
      ComplianceDisputeStatus.AwaitingEmployerResponse,
      ComplianceDisputeStatus.Resolved,
      ComplianceDisputeStatus.Rejected,
    ] as [string, ...string[]])
    .optional(),
  reviewerNotes: z.string().max(5000).optional().nullable(),
});

/**
 * GET /api/admin/compliance-disputes/[id]
 * Get one compliance dispute and optionally employer submissions tied to profile.
 * Admin only.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const sb = getSupabaseServer();

    const { data: dispute, error: disputeErr } = await sb
      .from("compliance_disputes")
      .select(
        "id, user_id, profile_id, dispute_type, description, status, reviewer_notes, created_at, resolved_at"
      )
      .eq("id", id)
      .single();

    if (disputeErr || !dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    const profileId = (dispute as { profile_id: string }).profile_id;

    const employerSubmissions: unknown[] = [];

    try {
      const { data: registryRows } = await sb
        .from("rehire_registry")
        .select(
          "id, employer_id, profile_id, rehire_eligible, rehire_status, reason, justification, updated_at"
        )
        .eq("profile_id", profileId);
      if (registryRows?.length) {
        employerSubmissions.push(...registryRows);
      }
    } catch {
      // rehire_registry or columns may not exist yet
    }

    try {
      const { data: employmentIds } = await sb
        .from("employment_records")
        .select("id")
        .eq("user_id", profileId);
      const ids = (employmentIds ?? []).map(
        (r: { id: string }) => r.id
      ) as string[];
      if (ids.length > 0) {
        const { data: rehireRows } = await sb
          .from("rehire_logs")
          .select(
            "id, employment_record_id, employer_id, rehire_status, reason, justification, created_at"
          )
          .in("employment_record_id", ids)
          .order("created_at", { ascending: false })
          .limit(20);
        if (rehireRows?.length) {
          employerSubmissions.push(...rehireRows);
        }
      }
    } catch {
      // rehire_logs columns may not exist yet
    }

    return NextResponse.json({
      dispute,
      employerSubmissions,
    });
  } catch (e) {
    console.error("[admin/compliance-disputes/[id]] GET error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/compliance-disputes/[id]
 * Update dispute status and/or reviewer notes. Admin only.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const sb = getSupabaseServer();
    const updates: ComplianceDisputeUpdate = {};
    if (parsed.data.status !== undefined) {
      updates.status = parsed.data.status as ComplianceDisputeUpdate["status"];
      if (
        parsed.data.status === ComplianceDisputeStatus.Resolved ||
        parsed.data.status === ComplianceDisputeStatus.Rejected
      ) {
        updates.resolved_at = new Date().toISOString();
      }
    }
    if (parsed.data.reviewerNotes !== undefined) {
      updates.reviewer_notes = parsed.data.reviewerNotes;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const { data: row, error } = await sb
      .from("compliance_disputes")
      .update(updates)
      .eq("id", id)
      .select("id, status, reviewer_notes, resolved_at")
      .single();

    if (error) {
      console.error("[admin/compliance-disputes/[id]] PATCH error:", error);
      return NextResponse.json(
        { error: "Failed to update dispute" },
        { status: 500 }
      );
    }

    return NextResponse.json(row);
  } catch (e) {
    console.error("[admin/compliance-disputes/[id]] PATCH error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
