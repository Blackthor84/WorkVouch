/**
 * Supabase typed client entry point.
 * Re-exports the full Database and Json from the canonical schema (types/database.ts).
 * Use: import type { Database } from "@/types/supabase"; createClient<Database>()
 *
 * To use Supabase-generated types instead, regenerate with:
 *   npx supabase gen types typescript --project-id <project-id> > types/supabase.ts
 * and ensure the generated schema includes all tables/views used by the app.
 */
export type { Database, Json } from "./database";
