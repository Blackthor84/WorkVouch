"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ACCEPTED_STATUSES = ["accepted", "confirmed"] as const;

export type SubmitCoworkerReferenceInput = {
  matchId: string;
  reviewedId: string;
  rating: number;
  reliability: number;
  teamwork: number;
  comment?: string | null;
};

/**
 * Submit a coworker reference (one per match). Only allowed when match exists and status is accepted/confirmed.
 * Prevents duplicates: one review per match (DB unique on match_id).
 */
export async function submitCoworkerReference(
  input: SubmitCoworkerReferenceInput
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { matchId, reviewedId, rating, reliability, teamwork, comment } = input;
  if (
    rating < 1 || rating > 5 ||
    reliability < 1 || reliability > 5 ||
    teamwork < 1 || teamwork > 5
  ) {
    return { error: "Rating, reliability, and teamwork must be between 1 and 5" };
  }

  const sb = supabase as any;

  const { data: match, error: matchErr } = await sb
    .from("coworker_matches")
    .select("id, user_1, user_2, status")
    .eq("id", matchId)
    .single();

  if (matchErr || !match) return { error: "Match not found" };
  if (!ACCEPTED_STATUSES.includes((match.status ?? "") as (typeof ACCEPTED_STATUSES)[number])) {
    return { error: "Match must be accepted or confirmed to leave a review" };
  }

  const otherId = match.user_1 === user.id ? match.user_2 : match.user_1;
  if (otherId !== reviewedId) return { error: "Reviewed user must be your match" };
  if (user.id === reviewedId) return { error: "You cannot review yourself" };

  const { error: insertErr } = await sb.from("coworker_references").insert({
    reviewer_id: user.id,
    reviewed_id: reviewedId,
    match_id: matchId,
    rating: Math.round(rating),
    reliability: Math.round(reliability),
    teamwork: Math.round(teamwork),
    comment: (comment ?? "").trim() || null,
  });

  if (insertErr) {
    if (insertErr.code === "23505") return { error: "You have already left a review for this match" };
    return { error: insertErr.message };
  }

  const { calculateTrustScore } = await import("@/lib/trustScore");
  await calculateTrustScore(reviewedId).catch((e) => {
    console.warn("[calculateTrustScore]", e);
  });

  revalidatePath("/profile");
  revalidatePath("/coworker-matches");
  return {};
}

/**
 * Get set of match_ids for which the current user has already left a coworker_reference.
 */
export async function getReviewedMatchIds(): Promise<Set<string>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const sb = supabase as any;
  const { data: rows } = await sb
    .from("coworker_references")
    .select("match_id")
    .eq("reviewer_id", user.id);
  const list = (rows ?? []) as { match_id: string }[];
  return new Set(list.map((r) => r.match_id));
}

export type CoworkerReferenceForProfile = {
  id: string;
  rating: number;
  reliability: number;
  teamwork: number;
  comment: string | null;
  created_at: string;
  reviewer_name: string | null;
};

/**
 * Get coworker references received by a user (for profile display).
 */
export async function getCoworkerReferencesForProfile(
  userId: string
): Promise<CoworkerReferenceForProfile[]> {
  const supabase = await createClient();
  const sb = supabase as any;

  const { data: rows, error } = await sb
    .from("coworker_references")
    .select("id, rating, reliability, teamwork, comment, created_at, reviewer_id")
    .eq("reviewed_id", userId)
    .order("created_at", { ascending: false });

  if (error || !rows?.length) return [];

  const reviewerIds = [...new Set((rows as { reviewer_id: string }[]).map((r) => r.reviewer_id))];
  const { data: profiles } = await sb
    .from("profiles")
    .select("id, full_name")
    .in("id", reviewerIds);
  const nameByKey: Record<string, string | null> = {};
  (profiles ?? []).forEach((p: { id: string; full_name: string | null }) => {
    nameByKey[p.id] = p.full_name ?? null;
  });

  return (rows as Array<{ id: string; rating: number; reliability: number; teamwork: number; comment: string | null; created_at: string; reviewer_id: string }>).map(
    (r) => ({
      id: r.id,
      rating: r.rating,
      reliability: r.reliability,
      teamwork: r.teamwork,
      comment: r.comment,
      created_at: r.created_at,
      reviewer_name: nameByKey[r.reviewer_id] ?? null,
    })
  );
}
