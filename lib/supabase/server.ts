import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/env.mjs";
import type { Database } from "@/lib/supabase/types";

export async function getServerSupabaseClient() {
  const cookieStore = await cookies();

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or Key is missing in env variables");
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { 
      persistSession: false, 
      detectSessionInUrl: false, 
      storage: {
        getItem: (key: string) => cookieStore.get(key)?.value ?? null,
        setItem: (key: string, value: string) => {
          cookieStore.set(key, value);
        },
        removeItem: (key: string) => {
          cookieStore.delete(key);
        },
      },
    },
  });
}

// Export with old names for backward compatibility
export const createSupabaseServerClient = getServerSupabaseClient;
export const createServerSupabaseClient = getServerSupabaseClient;
export const getSupabaseClient = getServerSupabaseClient;
export const createServerClient = getServerSupabaseClient;
