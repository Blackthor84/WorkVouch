/**
 * Service-role Supabase client for admin/sandbox-v2 routes.
 * No session cookies; uses SUPABASE_SERVICE_ROLE_KEY only.
 */
import { createClient } from "@supabase/supabase-js";

export function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
