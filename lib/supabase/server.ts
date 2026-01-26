import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/env.mjs";

export function createServerSupabase() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      headers: { cookie: cookies().toString() },
    }
  );
}
