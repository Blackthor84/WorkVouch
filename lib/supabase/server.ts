import { createServerClient } from "@supabase/ssr"
import { SupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function createServerSupabaseClient(): Promise<SupabaseClient> {

  const cookieStore = (await cookies()) as any

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )
}
