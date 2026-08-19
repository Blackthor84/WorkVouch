/**
 * Supabase admin client (service role) for auth.admin and privileged DB operations.
 * Re-exports lazy singleton from @/lib/supabase-admin — safe at Next.js build import time.
 */
export { admin as supabaseAdmin, getAdminClient } from "@/lib/supabase-admin";
