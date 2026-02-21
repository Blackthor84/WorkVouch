/**
 * Create a real profiles row for a sandbox user so impersonation can use a real UUID.
 * Impersonation API only accepts profile IDs; sandbox users are backed by profiles with sandbox_id set.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const SANDBOX_EMAIL_DOMAIN = "internal.workvouch.sandbox";

export type CreateSandboxProfileParams = {
  full_name: string;
  role: "user" | "employer";
  sandbox_id: string;
};

/**
 * Inserts a profile row for a sandbox user. Returns the profile id.
 * Caller must use service-role client.
 */
export async function createSandboxProfile(
  supabase: SupabaseClient<Database>,
  params: CreateSandboxProfileParams
): Promise<string> {
  const id = crypto.randomUUID();
  const email = `sandbox+${id}@${SANDBOX_EMAIL_DOMAIN}`;
  const { error } = await supabase.from("profiles").insert({
    id,
    full_name: params.full_name,
    email,
    role: params.role,
    sandbox_id: params.sandbox_id,
    visibility: "private",
    flagged_for_fraud: false,
  });
  if (error) throw new Error(`Sandbox profile create failed: ${error.message}`);
  return id;
}
