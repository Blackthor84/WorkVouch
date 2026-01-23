import { createClient } from "@supabase/supabase-js";
import { env } from "@/env.mjs";
import type { Database } from "@/types/database";

export const supabaseBrowserClient = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Export as supabase for backward compatibility
export const supabase = supabaseBrowserClient;
export const supabaseClient = supabaseBrowserClient;
export const getSupabaseClient = () => supabaseBrowserClient;
