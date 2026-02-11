/**
 * Supabase admin client (service role) for auth.admin and privileged DB operations.
 * Use for: updateUserById (email), admin_audit_logs, cross-tenant reads.
 * [AUTH_UPDATE] Do not persist session; server-side only.
 */
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
