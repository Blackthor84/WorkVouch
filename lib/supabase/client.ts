"use client";

import { createClient } from "@supabase/supabase-js";

let _instance: ReturnType<typeof createClient> | undefined;

if (!_instance) {
  _instance = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const supabaseBrowser = _instance!;
