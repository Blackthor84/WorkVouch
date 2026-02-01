"use client";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

let _instance: ReturnType<typeof createClient<Database>> | undefined;

if (!_instance) {
  _instance = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const supabaseBrowser = _instance!;
