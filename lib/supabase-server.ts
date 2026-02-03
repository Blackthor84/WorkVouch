/**
 * Canonical server-side Supabase client factory for App Router.
 * Use createServerSupabase() in Server Components, Route Handlers, Server Actions.
 * Uses cookies() from next/headers — no manual cookie parsing.
 */
export { createServerSupabase } from "@/lib/supabase/server";
