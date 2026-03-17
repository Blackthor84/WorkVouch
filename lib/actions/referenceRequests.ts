"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

/**
 * Count of pending reference requests received by the current user (for badge).
 */
export async function getPendingReferenceRequestCount(): Promise<number> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const sb = supabase as any;

    const { count, error } = await sb
      .from("reference_requests")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("status", "pending");

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
