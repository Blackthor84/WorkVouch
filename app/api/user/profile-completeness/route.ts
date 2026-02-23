/**
 * GET /api/user/profile-completeness
 * Returns profile completeness for the current user (employee dashboard).
 */
import { NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type ProfileCompletenessResponse = {
  hasName: boolean;
  hasEmail: boolean;
  jobsCount: number;
  referencesCount: number;
  emailVerified: boolean;
};

export async function GET() {
  try {
    const effective = await getEffectiveUser();
    if (!effective || effective.deleted_at) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServer();
    const supabaseAny = supabase as any;

    const [profileRes, jobsRes] = await Promise.all([
      supabaseAny.from("profiles").select("full_name, email, email_verified").eq("id", effective.id).single(),
      supabaseAny.from("employment_records").select("id").eq("user_id", effective.id),
    ]);

    const profile = profileRes?.data as { full_name?: string | null; email?: string | null; email_verified?: boolean } | null;
    const hasName = !!(profile?.full_name && String(profile.full_name).trim().length >= 2);
    const hasEmail = !!(profile?.email && String(profile.email).trim().length >= 3);
    const emailVerified = profile?.email_verified !== false;
    const recordIds = ((jobsRes?.data ?? []) as { id: string }[]).map((r) => r.id);
    const jobsCount = recordIds.length;

    let referencesCount = 0;
    if (recordIds.length > 0) {
      const refCountRes = await supabaseAny
        .from("employment_references")
        .select("id", { count: "exact", head: true })
        .in("employment_record_id", recordIds);
      referencesCount = typeof refCountRes?.count === "number" ? refCountRes.count : 0;
    }

    return NextResponse.json({
      hasName,
      hasEmail,
      jobsCount,
      referencesCount,
      emailVerified,
    } satisfies ProfileCompletenessResponse);
  } catch {
    return NextResponse.json(
      { error: "Failed to load profile completeness" },
      { status: 500 }
    );
  }
}
