/**
 * Shared type for industry name pools. Used by all industry pool files.
 */

export type NamePool = {
  firstNames: string[];
  lastNames: string[];
  departments: string[];
  /** department key -> job titles (repeated entries = higher weight; manager titles fewer for ratio) */
  jobTitles: Record<string, string[]>;
  geographicClusters: string[];
};
