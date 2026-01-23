/**
 * Client-side Supabase client
 * Safe to use in browser/React components
 * Uses anon key - safe to expose to frontend
 * ✅ Only used in React pages or components (client-side)
 * 
 * This file re-exports the centralized client from lib/supabaseClient.ts
 * for backward compatibility with existing imports.
 */
import { supabase } from "@/lib/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";

export const getSupabaseClient = (): SupabaseClient => {
  return supabase;
};

// Export supabase directly for convenience
export { supabase };

// Export as supabaseClient for backward compatibility (deprecated - use getSupabaseClient())
export const supabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = client[prop as keyof typeof client];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
