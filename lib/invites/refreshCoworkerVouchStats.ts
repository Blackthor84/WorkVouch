import { admin } from "@/lib/supabase-admin";
import { countAcceptedInvites } from "@/lib/invites/coworkerVouchInviteStore";
import { vouchProfileFieldsFromCount } from "@/lib/onboarding/vouchOnboarding";

/**
 * Application-side vouch stats refresh for public.invites (replaces refresh_user_vouch_stats RPC
 * which queries the absent coworker_invites table in production).
 */
export async function refreshCoworkerVouchStats(userId: string): Promise<void> {
  const count = await countAcceptedInvites(userId);
  const fields = vouchProfileFieldsFromCount(count);

  const { error } = await admin.from("profiles").update(fields).eq("id", userId);
  if (error) {
    console.warn("[refreshCoworkerVouchStats]", error.message);
  }
}
