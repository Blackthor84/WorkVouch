/**
 * Server-side Supabase admin client (service role).
 * ⚠️ MUST remain secret — never expose to browser. Only use in API routes and server code.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
