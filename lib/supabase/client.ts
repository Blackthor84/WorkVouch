/**
 * Client-side Supabase client
 * Safe to use in browser/React components
 * Uses anon key - safe to expose to frontend
 * ✅ Lazy-loaded to avoid build-time errors
 */
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

// Lazy initialization to avoid build-time errors
let _supabaseClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;

function getSupabaseClient() {
  if (_supabaseClient) {
    return _supabaseClient;
  }

  // Validate env vars at runtime (not build time) to work with Vercel
  const supabaseUrl = process.env.supabaseUrl;
  const supabaseKey = process.env.supabaseKey;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing required Supabase environment variables: supabaseUrl and supabaseKey must be set."
    );
  }

  _supabaseClient = createSupabaseClient<Database>(
    supabaseUrl,
    supabaseKey
  );

  return _supabaseClient;
}

// Export client instance (lazy-loaded)
export const supabaseClient = new Proxy({} as ReturnType<typeof createSupabaseClient<Database>>, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = client[prop as keyof typeof client];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

// Export createClient function for backward compatibility
export const createClient = () => getSupabaseClient();
