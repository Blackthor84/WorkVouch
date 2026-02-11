/**
 * Single source of truth for Supabase Database types.
 * Re-exports from types/database.ts (canonical schema with profiles.status, risk_level, etc.).
 *
 * To regenerate from Supabase schema (fix type drift):
 *   npx supabase gen types typescript --project-id <project-id> > types/database.ts
 * Then ensure profiles Row/Insert/Update include: status, risk_level, flagged_for_fraud, deleted_at.
 */
export type { Database } from "@/types/database";
export type { Json } from "@/types/database";
