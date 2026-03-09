/**
 * Data Access Layer (DAL) — centralized Supabase queries and mutations.
 * Use these instead of calling Supabase directly in pages/components.
 *
 * Queries: read-only (.select())
 * Mutations: write operations (.insert(), .update(), .delete())
 */

export * from "./queries";
export * from "./mutations";
export type { ProfileRow, JobRow, JobVerificationRow, EmploymentRecordRow, TrustEventRow, TrustRelationshipRow } from "./types";
