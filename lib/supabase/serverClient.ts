/**
 * Server-side Supabase client
 * ⚠️ Uses service role key - bypasses RLS
 * ✅ Only used in Next.js API routes or server actions
 * NEVER expose this to the browser
 * ✅ Initialized at runtime, not at module import time
 */
import { createClient } from "@supabase/supabase-js";

export const getSupabaseServerClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
};

// Export as supabaseServerClient for backward compatibility (deprecated - use getSupabaseServerClient())
export const supabaseServerClient = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    const client = getSupabaseServerClient();
    const value = client[prop as keyof typeof client];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
