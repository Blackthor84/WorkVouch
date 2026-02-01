/**
 * Supabase Database type — canonical export for createClient<Database>.
 * Re-exports from database.ts so all client creation uses the same schema.
 */
export type { Database } from "./database";
export * from "./database";
