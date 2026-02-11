import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { checkFeatureAccess } from "@/lib/feature-flags";
import { calculateAndStoreRisk } from "@/lib/risk/calculateAndPersist";
import { calculateEmployerWorkforceRisk } from "@/lib/risk/workforce";
import { logAuditAction } from "@/lib/audit";
import {
  RehireStatusEnum,
  RehireReasonEnum,
  type RehireStatusValue,
  type RehireReasonValue,
} from "@/lib/compliance-types";
import type { Database } from "@/types/supabase";
import { z } from "zod";

type RehireRegistryInsert = Database["public"]["Tables"]["rehire_registry"]["Insert"];
type RehireRegistryUpdate = Database["public"]["Tables"]["rehire_registry"]["Update"];
type RehireEvaluationVersionInsert =
  Database["public"]["Tables"]["rehire_evaluation_versions"]["Insert"];

const DETAILED_EXPLANATION_MIN_LENGTH = 150;

export const dynamic = "force-dynamic";

interface EmployerAccountRow {
  id: string;
}

async function getEmployerAccountId(userId: string): Promise<string | null> {
  const sb = getSupabaseServer();
  const { data } = await sb.from("employer_accounts").select("id").eq("user_id", userId);
  const row = Array.isArray(data) ? data[0] : data;
  return (row as EmployerAccountRow | null | undefined)?.id ?? null;
}

const rehireStatusValues = [
  RehireStatusEnum.Approved,
  RehireStatusEnum.EligibleWithReview,
  RehireStatusEnum.NotEligible,
] as const;

const rehireReasonValues = [
  RehireReasonEnum.AttendanceIssues,
  RehireReasonEnum.PolicyViolation,
  RehireReasonEnum.PerformanceConcerns,
  RehireReasonEnum.ContractCompletion,
  RehireReasonEnum.RoleEliminated,
  RehireReasonEnum.Other,
] as const;

const postBodySchema = z
  .object({
    profileId: z.string().uuid(),
    recommendation: z.enum(rehireStatusValues).optional(),
    rehireStatus: z.enum(rehireStatusValues).optional(),
    reasonCategory: z.enum(rehireReasonValues).optional(),
    reason: z.enum(rehireReasonValues).optional(),
    detailedExplanation: z.string().max(5000).optional().nullable(),
    justification: z.string().max(5000).optional().nullable(),
    confirmedAccuracy: z.boolean(),
    rehireEligible: z.boolean().optional(),
    internalNotes: z.string().max(2000).optional().nullable(),
  })
  .refine((data) => (data.recommendation ?? data.rehireStatus) != null, {
    message: "recommendation or rehireStatus is required.",
  })
  .refine(
    (data) => {
      const rec = data.recommendation ?? data.rehireStatus;
      if (rec !== RehireStatusEnum.EligibleWithReview && rec !== RehireStatusEnum.NotEligible)
        return data.confirmedAccuracy === true;
      const reasonCat = data.reasonCategory ?? data.reason;
      const explanation =
        data.detailedExplanation != null
          ? String(data.detailedExplanation).trim()
          : (data.justification != null ? String(data.justification).trim() : "");
      return (
        data.confirmedAccuracy === true &&
        reasonCat != null &&
        explanation.length >= DETAILED_EXPLANATION_MIN_LENGTH
      );
    },
    {
      message: `Submission requires confirmedAccuracy. When recommendation is EligibleWithReview or NotEligible: reason category and detailed explanation (min ${DETAILED_EXPLANATION_MIN_LENGTH} characters) are required.`,
    }
  );

/**
 * POST /api/employer/rehire
 * Body: profileId, rehireStatus (Approved | EligibleWithReview | NotEligible),
 *       reason (AttendanceIssues | PolicyViolation | PerformanceConcerns | ContractCompletion | RoleEliminated | Other),
 *       justification (required if EligibleWithReview, NotEligible, or reason=Other).
 * No free-form "mark not eligible" without reason and justification.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const hasEmployer = await hasRole("employer");
    const session = await getServerSession(authOptions);
    const roles = ((session?.user as { roles?: string[] })?.roles) ?? [];
    const isAdmin = roles.includes("admin") || roles.includes("superadmin");
    if (!hasEmployer && !isAdmin)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const enabled = await checkFeatureAccess("rehire_system", { userId: user.id });
    if (!enabled) return NextResponse.json({ error: "Feature not enabled" }, { status: 403 });

    const employerAccountId = await getEmployerAccountId(user.id);
    if (!employerAccountId)
      return NextResponse.json({ error: "Employer account not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const parsed = postBodySchema.safeParse({
      profileId: body?.profileId ?? body?.profile_id,
      recommendation: body?.recommendation ?? body?.rehireStatus ?? body?.rehire_status,
      rehireStatus: body?.rehireStatus ?? body?.rehire_status,
      reasonCategory: body?.reasonCategory ?? body?.reason,
      reason: body?.reason,
      detailedExplanation:
        body?.detailedExplanation ?? body?.justification ?? body?.internal_notes ?? null,
      justification: body?.justification ?? body?.internal_notes ?? null,
      confirmedAccuracy: body?.confirmedAccuracy === true,
      rehireEligible: body?.rehireEligible ?? body?.rehire_eligible,
      internalNotes: body?.internalNotes ?? body?.internal_notes ?? null,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors ?? parsed.error.message },
        { status: 400 }
      );
    }

    const rec = parsed.data.recommendation ?? parsed.data.rehireStatus;
    const reasonCat = parsed.data.reasonCategory ?? parsed.data.reason;
    const detailedExplanation =
      parsed.data.detailedExplanation ?? parsed.data.justification ?? null;
    const { profileId, confirmedAccuracy, internalNotes } = parsed.data;
    const rehireEligible =
      rec === RehireStatusEnum.Approved || rec === RehireStatusEnum.EligibleWithReview;

    const sb = getSupabaseServer();
    const now = new Date().toISOString();

    const existing = await sb
      .from("rehire_registry")
      .select("id, submitted_at, rehire_status, reason, detailed_explanation, confirmed_accuracy")
      .eq("employer_id", employerAccountId)
      .eq("profile_id", profileId)
      .maybeSingle();

    const existingRow = existing.data as
      | {
          id: string;
          submitted_at: string | null;
          rehire_status: string | null;
          reason: string | null;
          detailed_explanation: string | null;
          confirmed_accuracy: boolean;
        }
      | null;
    const isAlreadySubmitted = existingRow?.submitted_at != null;

    if (isAlreadySubmitted && existingRow) {
      const versionInsert: RehireEvaluationVersionInsert = {
        rehire_registry_id: existingRow.id,
        employer_id: employerAccountId,
        profile_id: profileId,
        rehire_status: existingRow.rehire_status as RehireEvaluationVersionInsert["rehire_status"],
        reason: existingRow.reason as RehireEvaluationVersionInsert["reason"],
        detailed_explanation: existingRow.detailed_explanation,
        confirmed_accuracy: existingRow.confirmed_accuracy,
        submitted_at: existingRow.submitted_at,
      };
      await sb.from("rehire_evaluation_versions")
        .insert(versionInsert);
    }

    const upsertPayload: RehireRegistryInsert = {
      employer_id: employerAccountId,
      profile_id: profileId,
      rehire_eligible: rehireEligible,
      rehire_status: rec as RehireRegistryInsert["rehire_status"],
      reason: rec === RehireStatusEnum.Approved ? null : (reasonCat as RehireRegistryInsert["reason"]),
      justification: detailedExplanation ?? null,
      detailed_explanation: detailedExplanation ?? null,
      confirmed_accuracy: confirmedAccuracy,
      internal_notes: internalNotes ?? detailedExplanation ?? null,
      updated_at: now,
      submitted_at: confirmedAccuracy ? now : (existingRow?.submitted_at ?? null),
    };

    const { error } = await sb.from("rehire_registry").upsert(upsertPayload, {
      onConflict: "employer_id,profile_id",
    });

    if (error) {
      console.error("Rehire POST error:", error);
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }

    if ((internalNotes ?? detailedExplanation)?.trim()) {
      await logAuditAction("internal_note_created", {
        employer_id: employerAccountId,
        profile_id: profileId,
        details: JSON.stringify({
          rehire_registry: true,
          recommendation: rec,
          reasonCategory: reasonCat,
          submitted_at: upsertPayload.submitted_at,
        }),
      });
    }

    try {
      await calculateAndStoreRisk(profileId);
      await calculateEmployerWorkforceRisk(employerAccountId);
    } catch (err: unknown) {
      console.error("[API][employer/rehire] POST risk/intelligence", { profileId, employerAccountId, err });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[API][employer/rehire] POST", { err });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * GET /api/employer/rehire — all rehire entries for this employer
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const hasEmployer = await hasRole("employer");
    const session = await getServerSession(authOptions);
    const roles = ((session?.user as { roles?: string[] })?.roles) ?? [];
    const isAdmin = roles.includes("admin") || roles.includes("superadmin");
    if (!hasEmployer && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const enabled = await checkFeatureAccess("rehire_system", { userId: user.id });
    if (!enabled) return NextResponse.json({ error: "Feature not enabled" }, { status: 403 });

    const employerAccountId = await getEmployerAccountId(user.id);
    if (!employerAccountId)
      return NextResponse.json({ error: "Employer account not found" }, { status: 404 });

    const sb = getSupabaseServer();
    const { data: rows, error } = await sb
      .from("rehire_registry")
      .select(
        "id, profile_id, rehire_eligible, rehire_status, reason, justification, detailed_explanation, confirmed_accuracy, submitted_at, internal_notes, created_at, updated_at"
      )
      .eq("employer_id", employerAccountId);

    if (error) {
      console.error("Rehire GET error:", error);
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }

    const list = (rows ?? []) as Array<{
      id: string;
      profile_id: string;
      rehire_eligible: boolean;
      rehire_status?: string | null;
      reason?: string | null;
      justification?: string | null;
      detailed_explanation?: string | null;
      confirmed_accuracy?: boolean;
      submitted_at?: string | null;
      internal_notes: string | null;
      created_at: string;
      updated_at: string;
    }>;
    const profileIds = list.map((r) => r.profile_id);
    const names: Record<string, string> = {};
    if (profileIds.length > 0) {
      const { data: profiles } = await getSupabaseServer()
        .from("profiles")
        .select("id, full_name")
        .in("id", profileIds);
      for (const p of (profiles ?? []) as { id: string; full_name: string | null }[]) {
        names[p.id] = p.full_name ?? "Unknown";
      }
    }
    const dataWithNames = list.map((r) => ({
      ...r,
      full_name: names[r.profile_id] ?? "Unknown",
    }));

    return NextResponse.json({ data: dataWithNames });
  } catch (err: unknown) {
    console.error("[API][employer/rehire] GET", { err });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

const patchBodySchema = z
  .object({
    profileId: z.string().uuid(),
    recommendation: z.enum(rehireStatusValues).optional(),
    rehireStatus: z.enum(rehireStatusValues).optional(),
    reasonCategory: z.enum(rehireReasonValues).optional(),
    reason: z.enum(rehireReasonValues).optional(),
    detailedExplanation: z.string().max(5000).optional().nullable(),
    justification: z.string().max(5000).optional().nullable(),
    confirmedAccuracy: z.boolean().optional(),
    internalNotes: z.string().max(2000).optional().nullable(),
  })
  .refine(
    (data) => {
      const rec = data.recommendation ?? data.rehireStatus;
      if (rec !== RehireStatusEnum.EligibleWithReview && rec !== RehireStatusEnum.NotEligible)
        return true;
      const reasonCat = data.reasonCategory ?? data.reason;
      const explanation =
        data.detailedExplanation != null
          ? String(data.detailedExplanation).trim()
          : (data.justification != null ? String(data.justification).trim() : "");
      const accuracyOk = data.confirmedAccuracy !== false;
      return reasonCat != null && explanation.length >= DETAILED_EXPLANATION_MIN_LENGTH && accuracyOk;
    },
    {
      message: `When recommendation is EligibleWithReview or NotEligible: reason category, detailed explanation (min ${DETAILED_EXPLANATION_MIN_LENGTH} characters), and confirmedAccuracy are required.`,
    }
  );

/**
 * PATCH /api/employer/rehire — update rehire for a profile.
 * When row is already submitted, current state is versioned before update.
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const hasEmployer = await hasRole("employer");
    const session = await getServerSession(authOptions);
    const roles = ((session?.user as { roles?: string[] })?.roles) ?? [];
    const isAdmin = roles.includes("admin") || roles.includes("superadmin");
    if (!hasEmployer && !isAdmin)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const enabled = await checkFeatureAccess("rehire_system", { userId: user.id });
    if (!enabled) return NextResponse.json({ error: "Feature not enabled" }, { status: 403 });

    const employerAccountId = await getEmployerAccountId(user.id);
    if (!employerAccountId)
      return NextResponse.json({ error: "Employer account not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const parsed = patchBodySchema.safeParse({
      profileId: body?.profileId ?? body?.profile_id,
      recommendation: body?.recommendation ?? body?.rehireStatus ?? body?.rehire_status,
      rehireStatus: body?.rehireStatus ?? body?.rehire_status,
      reasonCategory: body?.reasonCategory ?? body?.reason,
      reason: body?.reason,
      detailedExplanation:
        body?.detailedExplanation ?? body?.justification ?? body?.internal_notes ?? null,
      justification: body?.justification ?? body?.internal_notes ?? null,
      confirmedAccuracy: body?.confirmedAccuracy,
      internalNotes: body?.internalNotes ?? body?.internal_notes ?? null,
    });

    if (!parsed.success || !parsed.data.profileId) {
      const errMsg =
        parsed.success === false && parsed.error
          ? parsed.error.flatten().fieldErrors ?? parsed.error.message
          : "profileId required; recommendation, reasonCategory, detailedExplanation validated when provided.";
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    const rec = parsed.data.recommendation ?? parsed.data.rehireStatus;
    const reasonCat = parsed.data.reasonCategory ?? parsed.data.reason;
    const detailedExplanation =
      parsed.data.detailedExplanation ?? parsed.data.justification ?? null;
    const { profileId, confirmedAccuracy, internalNotes } = parsed.data;

    const sb = getSupabaseServer() as ReturnType<typeof getSupabaseServer>;
    const existing = await sb
      .from("rehire_registry")
      .select("id, submitted_at, rehire_status, reason, detailed_explanation, confirmed_accuracy")
      .eq("employer_id", employerAccountId)
      .eq("profile_id", profileId)
      .maybeSingle();

    const existingRow = existing.data as
      | {
          id: string;
          submitted_at: string | null;
          rehire_status: string | null;
          reason: string | null;
          detailed_explanation: string | null;
          confirmed_accuracy: boolean;
        }
      | null;
    if (existing.error || !existingRow) {
      return NextResponse.json({ error: "Rehire record not found" }, { status: 404 });
    }

    if (existingRow.submitted_at != null) {
      const versionInsert: RehireEvaluationVersionInsert = {
        rehire_registry_id: existingRow.id,
        employer_id: employerAccountId,
        profile_id: profileId,
        rehire_status: existingRow.rehire_status as RehireEvaluationVersionInsert["rehire_status"],
        reason: existingRow.reason as RehireEvaluationVersionInsert["reason"],
        detailed_explanation: existingRow.detailed_explanation,
        confirmed_accuracy: existingRow.confirmed_accuracy,
        submitted_at: existingRow.submitted_at,
      };
      await sb.from("rehire_evaluation_versions")
        .insert(versionInsert);
    }

    const updatePayload: RehireRegistryUpdate = { updated_at: new Date().toISOString() };
    if (rec !== undefined) {
      updatePayload.rehire_eligible =
        rec === RehireStatusEnum.Approved || rec === RehireStatusEnum.EligibleWithReview;
      updatePayload.rehire_status = rec as RehireRegistryUpdate["rehire_status"];
    }
    if (reasonCat !== undefined) updatePayload.reason = reasonCat as RehireRegistryUpdate["reason"];
    if (detailedExplanation !== undefined) {
      updatePayload.justification = detailedExplanation;
      updatePayload.detailed_explanation = detailedExplanation;
    }
    if (confirmedAccuracy !== undefined) updatePayload.confirmed_accuracy = confirmedAccuracy;
    if (internalNotes !== undefined) updatePayload.internal_notes = internalNotes ?? null;

    const { error } = await sb
      .from("rehire_registry")
      .update(updatePayload)
      .eq("employer_id", employerAccountId)
      .eq("profile_id", profileId);

    if (error) {
      console.error("Rehire PATCH error:", error);
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }

    try {
      await calculateAndStoreRisk(profileId);
      await calculateEmployerWorkforceRisk(employerAccountId);
    } catch (err: unknown) {
      console.error("[API][employer/rehire] PATCH risk/intelligence", { profileId, employerAccountId, err });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[API][employer/rehire] PATCH", { err });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
