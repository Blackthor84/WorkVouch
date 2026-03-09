/**
 * Service layer — business logic only.
 * Pages and API routes call services; services call DB queries/mutations.
 *
 * Structure: Pages → Services → DB (queries/mutations) → Supabase
 */

export * from "./profiles";
export type { CandidateProfileDTO, CandidatePreviewDTO } from "./types";
// export * from "./jobs";
// export * from "./verifications";
// export * from "./trust";
// export * from "./employers";
