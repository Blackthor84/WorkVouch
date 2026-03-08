/**
 * Server-side Supabase admin client.
 * Re-exports the shared admin client. Prefer importing { admin } from "@/lib/supabase-admin" in API routes.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { admin } from "@/lib/supabase-admin";

export { admin };

/**
 * @deprecated Prefer `import { admin } from "@/lib/supabase-admin"` in API routes.
 */
export function getSupabaseServer(): SupabaseClient<Database> {
  return admin;
}

export const supabaseServer = admin;
