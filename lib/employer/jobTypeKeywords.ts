export type JobTypeFilter = "all" | "security" | "hospitality" | "healthcare";

const PATTERNS: Record<Exclude<JobTypeFilter, "all">, RegExp> = {
  security: /security|guard|officer|patrol|loss prevention|bouncer|safety/i,
  hospitality: /hospitality|hotel|restaurant|server|chef|banquet|catering|front desk|housekeeping/i,
  healthcare: /health|nurse|nursing|medical|clinic|hospital|cna|caregiver|patient|pharm/i,
};

export function matchesJobTypeFilter(
  jobTitle: string,
  industry: string | null | undefined,
  filter: JobTypeFilter
): boolean {
  if (filter === "all") return true;
  const hay = `${jobTitle} ${industry ?? ""}`;
  return PATTERNS[filter].test(hay);
}
