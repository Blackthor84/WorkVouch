"use server";

import { createClient } from "@/lib/supabase/server";

export type LeaderboardEntry = {
  id: string;
  full_name: string | null;
  trust_score: number;
};

/**
 * Fetch most trusted users (leaderboard) by trust_scores, limited to public profiles.
 */
export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  try {
    const supabase = await createClient();
    const sb = supabase as any;

    const { data: scores, error } = await sb
      .from("trust_scores")
      .select("user_id, score")
      .order("score", { ascending: false })
      .limit(limit * 3);

    if (error || !scores?.length) return [];

    const seen = new Set<string>();
    const userIds = (scores as { user_id: string }[]).filter((s) => {
      if (seen.has(s.user_id)) return false;
      seen.add(s.user_id);
      return true;
    }).slice(0, limit).map((s) => s.user_id);
    const { data: profiles } = await sb
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    const profileMap: Record<string, { full_name: string | null }> = {};
    for (const p of (profiles ?? []) as { id: string; full_name: string | null }[]) {
      profileMap[p.id] = { full_name: p.full_name };
    }

    const scoreMap: Record<string, number> = {};
    for (const s of scores as { user_id: string; score: number }[]) {
      const current = scoreMap[s.user_id];
      if (current == null || s.score > current) scoreMap[s.user_id] = s.score;
    }

    return userIds
      .filter((id) => profileMap[id])
      .map((id) => ({
        id,
        full_name: profileMap[id].full_name,
        trust_score: Math.round(scoreMap[id] ?? 0),
      }));
  } catch (e) {
    console.warn("Leaderboard fetch failed", e);
    return [];
  }
}
