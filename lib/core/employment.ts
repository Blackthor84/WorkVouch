/**
 * Core employment logic. Single execution path. Re-exports from lib/employment.
 */

export {
  insertEmploymentFromResume,
  type InsertFromResumeResult,
} from "@/lib/employment/insertFromResume";
export type { NormalizedEmployment } from "@/lib/resume/parseAndStore";
