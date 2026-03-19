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
      .select("id, user_1, user_2")
      .eq("id", matchId)
      .single();

    if (fetchError || !row) {
      return { ok: false, error: "Match not found" };
    }

    if (row.user_1 !== user.id && row.user_2 !== user.id) {
      return { ok: false, error: "Not authorized to confirm this match" };
    }

    const { error: updateError } = await (supabase as any)
      .from("coworker_matches")
      .update({ status: "confirmed" })
      .eq("id", matchId);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    return { ok: true };
  } catch (e) {
    console.warn("confirmCoworkerMatch failed", e);
    return { ok: false, error: "Something went wrong" };
  }
}
