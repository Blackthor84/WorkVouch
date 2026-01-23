import { createServerClient as createSupabaseSSRClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/env.mjs";
import type { Database } from "@/types/database";

export const createSupabaseServerClient = async () => {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const cookieStore = await cookies();

  return createSupabaseSSRClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: any) {
        try {
          cookieStore.set(name, value, options);
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options?: any) {
        try {
          cookieStore.set(name, "", { ...options, maxAge: 0 });
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
};

// Export as getSupabaseClient for backward compatibility
export const getSupabaseClient = createSupabaseServerClient;

// Export as createServerClient for backward compatibility  
export const createServerClient = createSupabaseServerClient;

// Export with old name for backward compatibility (many files use this)
export const createServerSupabaseClient = createSupabaseServerClient;
