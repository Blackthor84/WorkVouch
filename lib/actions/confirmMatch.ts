"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

/**
 * Set coworker_matches.status to 'confirmed' for the given match id.
 * Caller must be user_1 or user_2 on the match.
 */
export async function confirmCoworkerMatch(matchId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { data: row, error: fetchError } = await (supabase as any)
      .from("coworker_matches")
      .select("id, user_1, user_2, user1_id, user2_id")
      .eq("id", matchId)
      .single();

    if (fetchError || !row) {
      return { ok: false, error: "Match not found" };
    }

    const u1 = row.user_1 ?? row.user1_id;
    const u2 = row.user_2 ?? row.user2_id;
    if (u1 !== user.id && u2 !== user.id) {
      return { ok: false, error: "Not authorized to confirm this match" };
    }

    const { error: updateError } = await (supabase as any)
      .from("coworker_matches")
      .update({ status: "confirmed" })
      .eq("id", matchId);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    const { calculateTrustScore } = await import("@/lib/trustScore");
    if (u1) await calculateTrustScore(u1 as string).catch((e) => console.warn("[calculateTrustScore]", e));
    if (u2) await calculateTrustScore(u2 as string).catch((e) => console.warn("[calculateTrustScore]", e));

    return { ok: true };
  } catch (e) {
    console.warn("confirmCoworkerMatch failed", e);
    return { ok: false, error: "Something went wrong" };
  }
}

/**
 * Set coworker_matches.status to 'rejected' for the given match id.
 * Caller must be user_1 or user_2 on the match.
 */
export async function denyCoworkerMatch(matchId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { data: row, error: fetchError } = await (supabase as any)
      .from("coworker_matches")
      .select("id, user_1, user_2, user1_id, user2_id")
      .eq("id", matchId)
      .single();

    if (fetchError || !row) {
      return { ok: false, error: "Match not found" };
    }

    const du1 = row.user_1 ?? row.user1_id;
    const du2 = row.user_2 ?? row.user2_id;
    if (du1 !== user.id && du2 !== user.id) {
      return { ok: false, error: "Not authorized to deny this match" };
    }

    const { error: updateError } = await (supabase as any)
      .from("coworker_matches")
      .update({ status: "rejected" })
      .eq("id", matchId);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    return { ok: true };
  } catch (e) {
    console.warn("denyCoworkerMatch failed", e);
    return { ok: false, error: "Something went wrong" };
  }
}
