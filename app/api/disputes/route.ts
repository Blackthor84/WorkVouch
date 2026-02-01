import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import {
  ComplianceDisputeType,
  ComplianceDisputeTypeValue,
} from "@/lib/compliance-types";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  profileId: z.string().uuid(),
  disputeType: z.enum([
    ComplianceDisputeType.RehireStatus,
    ComplianceDisputeType.EmploymentDates,
    ComplianceDisputeType.PeerVerification,
    ComplianceDisputeType.Other,
  ] as [string, ...string[]]),
  description: z.string().min(10).max(5000),
  evaluationId: z.string().uuid().optional(),
});

/**
 * Identity verification requirement: placeholder.
 * Require authenticated user; optionally require profile.identity_verified_at when column exists.
 */
async function requireIdentityVerification(userId: string): Promise<{
  allowed: boolean;
  error?: string;
}> {
  const sb = getSupabaseServer() as ReturnType<typeof getSupabaseServer>;
  const { data: profile } = await sb
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();
  if (!profile) {
    return { allowed: false, error: "Profile not found" };
  }
  // When identity_verified_at exists on profiles, add: .select("id, identity_verified_at") and check identity_verified_at != null
  return { allowed: true };
}

/**
 * POST /api/disputes
 * Create a compliance dispute. Requires authenticated user and identity verification (placeholder).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const identityCheck = await requireIdentityVerification(user.id);
    if (!identityCheck.allowed) {
      return NextResponse.json(
        {
          error:
            identityCheck.error ??
            "Identity verification is required before submitting a dispute.",
        },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const sb = getSupabaseServer() as ReturnType<typeof getSupabaseServer>;
    const insertPayload: Record<string, unknown> = {
      user_id: user.id,
      profile_id: parsed.data.profileId,
      dispute_type: parsed.data.disputeType as ComplianceDisputeTypeValue,
      description: parsed.data.description,
      status: "Pending",
    };
    if (parsed.data.disputeType === ComplianceDisputeType.RehireStatus && parsed.data.evaluationId) {
      insertPayload.evaluation_id = parsed.data.evaluationId;
    }
    const { data: row, error } = await sb
      .from("compliance_disputes")
      .insert(insertPayload)
      .select("id, status, created_at")
      .single();

    if (error) {
      console.error("[api/disputes] insert error:", error);
      return NextResponse.json(
        { error: "Failed to create dispute" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: row.id,
      status: row.status,
      created_at: row.created_at,
    });
  } catch (e) {
    console.error("[api/disputes] error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
