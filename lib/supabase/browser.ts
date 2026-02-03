"use client";

/**
 * Single browser Supabase client for the app.
 * All client-side Supabase usage must import from this file or lib/supabase/client (re-export).
 * Users remain logged in until explicit logout.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let _instance: ReturnType<typeof createClient<Database>> | undefined;

function getBrowserClient(): ReturnType<typeof createClient<Database>> {
  if (!_instance) {
    _instance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    });
  }
  return _instance;
}

export const supabaseBrowser = getBrowserClient();
