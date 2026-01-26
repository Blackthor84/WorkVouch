import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/env.mjs";

export function createServerSupabase() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${
            cookies().get("supabase-auth-token")?.value ?? ""
          }`,
        },
      },
    }
  );
}
