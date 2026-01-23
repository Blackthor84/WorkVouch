/**
 * Client-side Supabase client
 * Safe to use in browser/React components
 * Uses anon key - safe to expose to frontend
 * ✅ Only used in React pages or components (client-side)
 * ✅ Initialized at runtime, not at module import time
 */
import { createClient } from "@supabase/supabase-js";

export const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anonKey);
};

// Export as supabaseClient for backward compatibility (deprecated - use getSupabaseClient())
export const supabaseClient = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = client[prop as keyof typeof client];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
