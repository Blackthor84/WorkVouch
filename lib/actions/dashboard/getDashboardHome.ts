"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export type DashboardMatchPreview = {
  id: string;
  otherUserName: string;
  company: string;
  status: string;
  createdAt: string;
};

export type DashboardActivityItem = {
  id: string;
  message: string;
  createdAt: string;
  variant: "match" | "review" | "request" | "default";
};

export type DashboardHomeData = {
  displayName: string;
  firstName: string;
  trustScore: number;
  hasTrustRow: boolean;
  /** Distinct coworkers who left a coworker_reference for you */
  verifiedByCoworkers: number;
  referenceCount: number;
  matchesCount: number;
  jobsCount: number;
  profileStrengthPct: number;
  matchesPreview: DashboardMatchPreview[];
  activities: DashboardActivityItem[];
  isNewUser: boolean;
};

function firstName(full: string | null | undefined): string {
  if (!full?.trim()) return "there";
  return full.trim().split(/\s+/)[0] ?? "there";
}

function formatActivityMessage(action: string, target: string | null, meta: Record<string, unknown> | null): string {
  const a = (action ?? "").toLowerCase();
  const t = target?.trim();
  if (a.includes("match") && t) return `New match: ${t}`;
  if (a.includes("review") && t) return `New review: ${t}`;
  if (a.includes("reference") && t) return `Reference update: ${t}`;
  if (t) return `${action.replace(/_/g, " ")} — ${t}`;
  return action.replace(/_/g, " ") || "Activity";
}

export async function getDashboardHomeData(): Promise<DashboardHomeData | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            /* ignore */
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const sb = supabase as any;
  const uid = user.id;

  try {
    const [
      profileRes,
      trustRes,
      jobsCountRes,
      matchesCountRes,
      matchesPreviewRes,
      coworkerRefsRes,
      activityRes,
    ] = await Promise.all([
      sb.from("profiles").select("full_name, professional_summary").eq("id", uid).maybeSingle(),
      sb.from("trust_scores").select("score, reference_count").eq("user_id", uid).maybeSingle(),
      sb.from("jobs").select("id", { count: "exact", head: true }).eq("user_id", uid),
      sb.from("coworker_matches").select("id", { count: "exact", head: true }).or(`user1_id.eq.${uid},user2_id.eq.${uid}`),
      sb
        .from("coworker_matches")
        .select("id, status, company_name, user1_id, user2_id, created_at")
        .or(`user1_id.eq.${uid},user2_id.eq.${uid}`)
        .order("created_at", { ascending: false })
        .limit(3),
      sb.from("coworker_references").select("reviewer_id").eq("reviewed_id", uid),
      sb.from("activity_log").select("id, action, target, metadata, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(12),
    ]);

    const profile = profileRes.data as { full_name?: string | null; professional_summary?: string | null } | null;
    const displayName = profile?.full_name?.trim() || "Member";
    const fn = firstName(profile?.full_name);

    const trustRow = trustRes.data as { score?: number; reference_count?: number } | null;
    const trustScore = Math.round(Number(trustRow?.score ?? 0));
    const hasTrustRow = !!trustRow;
    const referenceCount = Number(trustRow?.reference_count ?? 0);

    const jobsCount = Number(jobsCountRes.count ?? 0);
    const matchesCount = Number(matchesCountRes.count ?? 0);

    const reviewerIds = [
      ...new Set(
        ((coworkerRefsRes.data ?? []) as { reviewer_id: string }[]).map((r) => r.reviewer_id).filter(Boolean)
      ),
    ];
    const verifiedByCoworkers = reviewerIds.length;

    const previewRows = (matchesPreviewRes.data ?? []) as {
      id: string;
      status: string | null;
      company_name: string | null;
      user1_id: string;
      user2_id: string;
      created_at: string;
    }[];

    const otherIds = [...new Set(previewRows.map((r) => (r.user1_id === uid ? r.user2_id : r.user1_id)))];
    let nameById: Record<string, string> = {};
    if (otherIds.length > 0) {
      const { data: profs } = await sb.from("profiles").select("id, full_name").in("id", otherIds);
      for (const p of (profs ?? []) as { id: string; full_name: string | null }[]) {
        nameById[p.id] = p.full_name?.trim() || "Coworker";
      }
    }

    const matchesPreview: DashboardMatchPreview[] = previewRows.map((r) => {
      const other = r.user1_id === uid ? r.user2_id : r.user1_id;
      return {
        id: r.id,
        otherUserName: nameById[other] ?? "Coworker",
        company: r.company_name?.trim() || "Company",
        status: (r.status ?? "pending").trim(),
        createdAt: r.created_at,
      };
    });

    // Profile strength: jobs, bio, references (weighted)
    const bioOk = (profile?.professional_summary?.trim().length ?? 0) >= 40;
    let strengthPts = 0;
    if (jobsCount > 0) strengthPts += 34;
    if (bioOk) strengthPts += 33;
    if (referenceCount > 0) strengthPts += 33;
    const profileStrengthPct = Math.min(100, strengthPts);

    const activityRows = (activityRes.data ?? []) as {
      id: string;
      action: string;
      target: string | null;
      metadata: Record<string, unknown> | null;
      created_at: string;
    }[];

    let activities: DashboardActivityItem[] = activityRows.map((row) => {
      const a = (row.action ?? "").toLowerCase();
      let variant: DashboardActivityItem["variant"] = "default";
      if (a.includes("match")) variant = "match";
      else if (a.includes("review") || a.includes("reference")) variant = "review";
      else if (a.includes("request")) variant = "request";

      return {
        id: row.id,
        message: formatActivityMessage(row.action, row.target, row.metadata),
        createdAt: row.created_at,
        variant,
      };
    });

    const reviewRows = recentReviewsRes.data;
    const revIds = [...new Set(((reviewRows ?? []) as { reviewer_id: string }[]).map((x) => x.reviewer_id))];
    const revNames: Record<string, string> = { ...nameById };
    if (revIds.some((id) => !revNames[id])) {
      const missing = revIds.filter((id) => !revNames[id]);
      const { data: rp } = await sb.from("profiles").select("id, full_name").in("id", missing);
      for (const p of (rp ?? []) as { id: string; full_name: string | null }[]) {
        revNames[p.id] = p.full_name?.trim() || "Coworker";
      }
    }
    const syntheticFromReviews: DashboardActivityItem[] = ((reviewRows ?? []) as {
      id: string;
      created_at: string;
      reviewer_id: string;
    }[]).map((r) => ({
      id: `review-${r.id}`,
      message: `${revNames[r.reviewer_id] ?? "Someone"} reviewed you as a coworker`,
      createdAt: r.created_at,
      variant: "review" as const,
    }));

    const syntheticFromMatches: DashboardActivityItem[] = matchesPreview.map((m) => ({
      id: `match-${m.id}`,
      message: `${m.otherUserName} matched with you at ${m.company}`,
      createdAt: m.createdAt,
      variant: "match" as const,
    }));

    const merged = [...activities, ...syntheticFromReviews, ...syntheticFromMatches];
    const seen = new Set<string>();
    activities = merged
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    const isNewUser = jobsCount === 0 && matchesCount === 0 && referenceCount === 0;

    return {
      displayName,
      firstName: fn,
      trustScore,
      hasTrustRow,
      verifiedByCoworkers,
      referenceCount,
      matchesCount,
      jobsCount,
      profileStrengthPct,
      matchesPreview,
      activities,
      isNewUser,
    };
  } catch (e) {
    console.warn("getDashboardHomeData failed", e);
    return {
      displayName: "Member",
      firstName: "there",
      trustScore: 0,
      hasTrustRow: false,
      verifiedByCoworkers: 0,
      referenceCount: 0,
      matchesCount: 0,
      jobsCount: 0,
      profileStrengthPct: 0,
      matchesPreview: [],
      activities: [],
      isNewUser: true,
    };
  }
}
