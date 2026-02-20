/**
 * User activity log (user_activity_log). Insert-only; used for forensics and timeline.
 * Use service role to insert.
 */

import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export type UserActivityType =
  | "review_created"
  | "review_deleted"
  | "employment_added"
  | "employment_deleted"
  | "role_changed"
  | "login"
  | "logout"
  | "profile_updated"
  | "suspended"
  | "unsuspended"
  | "soft_deleted"
  | "hard_deleted"
  | "recalculate"
  | "fraud_flagged"
  | "admin_impersonate"
  | "clicked_button";

export async function insertUserActivity(params: {
  userId: string;
  type: UserActivityType;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  const supabase = getServiceRoleClient();
  await supabase.from("user_activity_log").insert({
    user_id: params.userId,
    type: params.type,
    metadata: params.metadata ?? null,
  });
}
