/**
 * Gamified trust score (0–100) persisted to `profiles.trust_score` and mirrored to `trust_scores`.
 * Server-only; uses admin client for consistent reads/writes.
 *
 * Import via `@/lib/trustScore` as `calculateTrustScore(userId)` (re-exported alias).
 */

import { admin } from "@/lib/supabase-admin";

const CAP = 100;
const PTS_VERIFIED_REFERENCE = 15;
const PTS_CONFIRMED_MATCH = 5;
const PTS_JOB_WITH_REFERENCE = 10;
const PTS_FIRST_THREE_EXTRA = 10;
const PTS_MULTI_REF_SAME_JOB = 10;
const PTS_CONSISTENT_PROFILE = 5;

export type GamifiedTrustBreakdown = {
  verifiedReferenceCount: number;
  referenceBasePoints: number;
  confirmedMatchCount: number;
  matchPoints: number;
  jobsWithAtLeastOneRef: number;
  jobWithRefPoints: number;
  firstThreeBonus: number;
  multiRefSameJobBonus: number;
  consistentProfileBonus: number;
  rawTotal: number;
  cappedScore: number;
};

type MatchRow = Record<string, string | null | undefined>;

function matchUsers(m: MatchRow): [string, string] | null {
  const u1 = (m.user_1 ?? m.user1_id) as string | undefined;
  const u2 = (m.user_2 ?? m.user2_id) as string | undefined;
  if (u1 && u2) return [u1, u2];
  return null;
}

function matchJobs(m: MatchRow): [string, string] | null {
  const j1 = (m.job_1 ?? m.job1_id) as string | undefined;
  const j2 = (m.job_2 ?? m.job2_id) as string | undefined;
  if (j1 && j2) return [j1, j2];
  return null;
}

function jobIdForUserInMatch(m: MatchRow, userId: string): string | null {
  const users = matchUsers(m);
  const jobs = matchJobs(m);
  if (!users || !jobs) return null;
  if (users[0] === userId) return jobs[0];
  if (users[1] === userId) return jobs[1];
  return null;
}

type RefEvent = { key: string; at: string; jobId: string | null };

/**
 * Compute and store gamified trust for a user (`profiles.trust_score` + `trust_scores` upsert).
 */
export async function calculateGamifiedTrustScore(userId: string): Promise<{
  score: number;
  breakdown: GamifiedTrustBreakdown;
}> {
  const sb = admin as any;

  const [rfRes, urRes, crRes, erRes, matchesRes, jobsRes, profileRes] =
    await Promise.all([
      sb
        .from("reference_feedback")
        .select("id, created_at, target_user_id, request_id")
        .eq("target_user_id", userId),
      sb
        .from("user_references")
        .select("id, created_at, job_id, to_user_id, is_deleted")
        .eq("to_user_id", userId)
        .eq("is_deleted", false),
      sb
        .from("coworker_references")
        .select("id, created_at, reviewed_id, match_id")
        .eq("reviewed_id", userId),
      sb
        .from("employment_references")
        .select("id, created_at, reviewed_user_id, employment_match_id")
        .eq("reviewed_user_id", userId),
      sb
        .from("coworker_matches")
        .select(
          "id, status, user_1, user_2, user1_id, user2_id, job_1, job_2, job1_id, job2_id"
        )
        .eq("status", "confirmed")
        .or(
          `user_1.eq.${userId},user_2.eq.${userId},user1_id.eq.${userId},user2_id.eq.${userId}`
        ),
      sb.from("jobs").select("id").eq("user_id", userId),
      sb
        .from("profiles")
        .select("full_name, professional_summary, location, state")
        .eq("id", userId)
        .maybeSingle(),
    ]);

  const rfRows = (rfRes.data ?? []) as {
    id: string;
    created_at: string;
    request_id: string;
  }[];
  const urRows = (urRes.data ?? []) as {
    id: string;
    created_at: string;
    job_id: string;
    is_deleted?: boolean | null;
  }[];
  const crRows = (crRes.data ?? []) as {
    id: string;
    created_at: string;
    match_id: string;
  }[];
  const erRows = (erRes.data ?? []) as {
    id: string;
    created_at: string;
    employment_match_id: string;
  }[];

  const userJobIds = new Set(
    ((jobsRes.data ?? []) as { id: string }[]).map((j) => j.id)
  );

  const requestIds = [...new Set(rfRows.map((r) => r.request_id))];
  const reqById: Record<
    string,
    { coworker_match_id: string; requester_id: string }
  > = {};
  if (requestIds.length > 0) {
    const { data: reqs } = await sb
      .from("reference_requests")
      .select("id, coworker_match_id, requester_id")
      .in("id", requestIds);
    for (const r of (reqs ?? []) as {
      id: string;
      coworker_match_id: string;
      requester_id: string;
    }[]) {
      reqById[r.id] = {
        coworker_match_id: r.coworker_match_id,
        requester_id: r.requester_id,
      };
    }
  }

  const matchIdsNeeded = new Set<string>();
  for (const r of crRows) matchIdsNeeded.add(r.match_id);
  for (const r of rfRows) {
    const req = reqById[r.request_id];
    if (req?.coworker_match_id) matchIdsNeeded.add(req.coworker_match_id);
  }

  const matchById = new Map<string, MatchRow>();
  if (matchIdsNeeded.size > 0) {
    const { data: neededMatches } = await sb
      .from("coworker_matches")
      .select(
        "id, user_1, user_2, user1_id, user2_id, job_1, job_2, job1_id, job2_id"
      )
      .in("id", [...matchIdsNeeded]);
    for (const m of (neededMatches ?? []) as MatchRow[]) {
      const mid = m.id as string;
      if (mid) matchById.set(mid, m);
    }
  }

  const refEvents: RefEvent[] = [];

  for (const r of rfRows) {
    const req = reqById[r.request_id];
    let jobId: string | null = null;
    if (req) {
      const cm = matchById.get(req.coworker_match_id);
      if (cm) {
        jobId = jobIdForUserInMatch(cm, req.requester_id);
      }
    }
    refEvents.push({
      key: `rf:${r.id}`,
      at: r.created_at,
      jobId,
    });
  }

  for (const r of urRows) {
    if (r.is_deleted === true) continue; // treat null/undefined as not deleted
    refEvents.push({
      key: `ur:${r.id}`,
      at: r.created_at,
      jobId: r.job_id ?? null,
    });
  }

  for (const r of crRows) {
    const cm = matchById.get(r.match_id);
    const jobId = cm ? jobIdForUserInMatch(cm, userId) : null;
    refEvents.push({
      key: `cr:${r.id}`,
      at: r.created_at,
      jobId,
    });
  }

  for (const r of erRows) {
    refEvents.push({
      key: `er:${r.id}`,
      at: r.created_at,
      jobId: `em:${r.employment_match_id}`,
    });
  }

  refEvents.sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
  );

  const verifiedReferenceCount = refEvents.length;
  const referenceBasePoints = verifiedReferenceCount * PTS_VERIFIED_REFERENCE;

  const confirmedMatches = (matchesRes.data ?? []) as MatchRow[];
  const confirmedMatchCount = confirmedMatches.length;
  const matchPoints = confirmedMatchCount * PTS_CONFIRMED_MATCH;

  const jobRefCount = new Map<string, number>();
  for (const ev of refEvents) {
    if (!ev.jobId) continue;
    jobRefCount.set(ev.jobId, (jobRefCount.get(ev.jobId) ?? 0) + 1);
  }

  let jobsWithAtLeastOneRef = 0;
  let multiRefSameJobBonus = 0;
  for (const [jid, n] of jobRefCount) {
    const isUserJob = userJobIds.has(jid);
    if (isUserJob && n >= 1) {
      jobsWithAtLeastOneRef += 1;
    }
    if (n >= 2) {
      multiRefSameJobBonus += PTS_MULTI_REF_SAME_JOB;
    }
  }

  const jobWithRefPoints = jobsWithAtLeastOneRef * PTS_JOB_WITH_REFERENCE;

  const firstThreeBonus = Math.min(3, refEvents.length) * PTS_FIRST_THREE_EXTRA;

  const profile = profileRes.data as {
    full_name?: string | null;
    professional_summary?: string | null;
    location?: string | null;
    state?: string | null;
  } | null;
  const hasProfile =
    !!(profile?.full_name ?? "").trim() &&
    !!(profile?.professional_summary ?? "").trim() &&
    (!!(profile?.location ?? "").trim() ||
      !!(profile?.state ?? "").trim());
  const consistentProfileBonus = hasProfile ? PTS_CONSISTENT_PROFILE : 0;

  const rawTotal =
    referenceBasePoints +
    matchPoints +
    jobWithRefPoints +
    firstThreeBonus +
    multiRefSameJobBonus +
    consistentProfileBonus;

  const cappedScore = Math.max(0, Math.min(CAP, rawTotal));

  await sb
    .from("profiles")
    .update({
      trust_score: cappedScore,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  await sb.from("trust_scores").upsert(
    {
      user_id: userId,
      score: cappedScore,
      reference_count: verifiedReferenceCount,
      job_count: jobsWithAtLeastOneRef,
      average_rating: null,
      calculated_at: new Date().toISOString(),
      version: "gamified_v1",
    },
    { onConflict: "user_id" }
  );

  const breakdown: GamifiedTrustBreakdown = {
    verifiedReferenceCount,
    referenceBasePoints,
    confirmedMatchCount,
    matchPoints,
    jobsWithAtLeastOneRef,
    jobWithRefPoints,
    firstThreeBonus,
    multiRefSameJobBonus,
    consistentProfileBonus,
    rawTotal,
    cappedScore,
  };

  return { score: cappedScore, breakdown };
}
