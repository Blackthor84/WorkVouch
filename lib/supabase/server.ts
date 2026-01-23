import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export async function createServerSupabaseClient() {
  // In Next.js 16, cookies() is async and must be awaited
  const cookieStore = await cookies();

  // Get environment variables at runtime (not build time)
  const supabaseUrl = process.env.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing supabaseUrl or supabaseKey in environment variables.');
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      storageKey: "sb-session",
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      storage: {
        getItem: (key) => cookieStore.get(key)?.value ?? null,
        setItem: (key, value) => {
          cookieStore.set(key, value);
        },
        removeItem: (key) => {
          cookieStore.delete(key);
        },
      },
    },
  });
}

// Export as getSupabaseClient for backward compatibility
export const getSupabaseClient = createServerSupabaseClient;

// Export as createSupabaseServerClient for backward compatibility
export const createSupabaseServerClient = createServerSupabaseClient;

// Export as createServerClient for backward compatibility
export const createServerClient = createServerSupabaseClient;
