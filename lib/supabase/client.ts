"use client";

import { createBrowserClient } from "@supabase/ssr";

export const supabaseBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** @deprecated Use supabaseBrowser. Kept for mobile app. */
export const supabase = supabaseBrowser;
