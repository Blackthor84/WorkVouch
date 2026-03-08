import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Canonical server-side auth. Use this everywhere instead of getSession().
 * getSession() is insecure (can return stale session); getUser() validates the JWT on every request.
 * Callers: if getUser() returns null, return 401 Unauthorized or redirect to login.
 */
export async function getUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }
  return user;
}
