"use client";

import { createBrowserClient } from "@supabase/ssr";
import { enforceSingleSupabaseClient } from "./guard";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  if (typeof window !== "undefined") {
    enforceSingleSupabaseClient();
  }

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return browserClient;
}

export const supabase = getSupabaseBrowserClient();

/** @deprecated Use `supabase` — kept for backward compatibility. */
export const supabaseBrowser = supabase;
