/**
 * GET /api/user/references-insights — References for current user with badge and recency insights.
 * Used by employee reference view to show Direct Manager, Repeated Coworker, Verified Match and Strong/Aging/Stale.
 */

import { NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getReferenceCredibilityBadges } from "@/lib/employer/referenceCredibilityBadges";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MS_PER_DAY = 86400 * 1000;

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / MS_PER_DAY);
}

/** Strong: &lt;1yr, Aging: 1–2yr, Stale: &gt;2yr */
function recencyStatus(createdAt: string): "Strong" | "Aging" | "Stale" {
  const days = daysAgo(createdAt);
  if (days <= 365) return "Strong";
  if (days <= 730) return "Aging";
  return "Stale";
}

export type ReferenceInsight = {
  id: string;
  created_at: string;
  rating: number;
  written_feedback: string | null;
  relationship_type?: string | null;
  is_direct_manager: boolean;
  is_repeated_coworker: boolean;
  is_verified_match: boolean;
  recency: "Strong" | "Aging" | "Stale";
  from_user?: { full_name?: string; profile_photo_url?: string | null } | null;
  job?: { company_name?: string; job_title?: string } | null;
};

export async function GET() {
  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const supabaseAny = supabase as unknown as Parameters<typeof getReferenceCredibilityBadges>[0];

  const { data: refs, error } = await supabase
    .from("user_references")
    .select("id, created_at, rating, written_feedback, relationship_type, from_user_id, job_id")
    .eq("to_user_id", effective.id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (refs ?? []) as Array<{
    id: string;
    created_at: string;
    rating: number;
    written_feedback: string | null;
    relationship_type?: string | null;
    from_user_id: string;
    job_id: string;
  }>;

  const jobIds = [...new Set(list.map((r) => r.job_id).filter(Boolean))];
  const fromIds = [...new Set(list.map((r) => r.from_user_id).filter(Boolean))];
  const [jobsData, profilesData] = await Promise.all([
    jobIds.length > 0
      ? supabase.from("jobs").select("id, company_name, job_title").in("id", jobIds)
      : Promise.resolve({ data: [] }),
    fromIds.length > 0
      ? supabase.from("profiles").select("id, full_name, profile_photo_url").in("id", fromIds)
      : Promise.resolve({ data: [] }),
  ]);
  const jobsMap = new Map(
    ((jobsData.data ?? []) as { id: string; company_name?: string; job_title?: string }[]).map((j) => [j.id, j])
  );
  const profilesMap = new Map(
    ((profilesData.data ?? []) as { id: string; full_name?: string; profile_photo_url?: string | null }[]).map((p) => [p.id, p])
  );

  const refInputs = list.map((r) => ({
    id: r.id,
    from_user_id: r.from_user_id,
    job_id: r.job_id,
    relationship_type: r.relationship_type ?? undefined,
  }));
  const badges = await getReferenceCredibilityBadges(supabaseAny, effective.id, refInputs);

  const insights: ReferenceInsight[] = list.map((ref) => ({
    id: ref.id,
    created_at: ref.created_at,
    rating: ref.rating,
    written_feedback: ref.written_feedback,
    relationship_type: ref.relationship_type,
    is_direct_manager: badges[ref.id]?.is_direct_manager ?? false,
    is_repeated_coworker: badges[ref.id]?.is_repeated_coworker ?? false,
    is_verified_match: badges[ref.id]?.is_verified_match ?? false,
    recency: recencyStatus(ref.created_at),
    from_user: profilesMap.get(ref.from_user_id) ?? null,
    job: ref.job_id ? jobsMap.get(ref.job_id) ?? null : null,
  }));

  return NextResponse.json({ references: insights });
}
