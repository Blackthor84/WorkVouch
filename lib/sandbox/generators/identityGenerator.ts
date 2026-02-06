/**
 * Sandbox identity generator. Uses name pools via getPool; no hardcoded industry switch.
 * Ensures unique full names per sandbox via usedFullNames Set.
 * Weighted department and job title selection from pool arrays.
 */

import { getPool } from "@/lib/sandbox/namePools";

export type EmployeeIdentity = {
  fullName: string;
  department: string;
  jobTitle: string;
  geographicCluster: string;
  industry: string;
};

type GenerateOptions = {
  industry: string;
  department?: string;
  sandboxId?: string;
};

/**
 * Pick random element from array (repeated entries = higher weight).
 */
function pickWeighted<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/**
 * Generate a single employee identity. Uses getPool for arrays; no duplicate full names in usedFullNames.
 * Caller must pass and mutate usedFullNames (add returned fullName) to enforce uniqueness per sandbox.
 */
export function generateEmployeeIdentity(
  options: GenerateOptions,
  usedFullNames: Set<string>
): EmployeeIdentity {
  const { industry, department: departmentHint } = options;
  const firstNames = getPool("firstNames");
  const lastNames = getPool("lastNames");
  const departments = getPool("departments");
  const jobTitles = getPool("jobTitles");
  const geographicClusters = getPool("geographicClusters");

  const department =
    departmentHint && departments.includes(departmentHint)
      ? departmentHint
      : departments.length ? pickWeighted(departments) : "General";

  const jobTitle = jobTitles.length ? pickWeighted(jobTitles) : department;

  const geographicCluster =
    geographicClusters.length ? pickWeighted(geographicClusters) : "Default";

  const maxAttempts = Math.max(100, firstNames.length * lastNames.length * 2);
  let fullName: string;
  let attempts = 0;
  do {
    const first = firstNames.length ? pickWeighted(firstNames) : "Unknown";
    const last = lastNames.length ? pickWeighted(lastNames) : "Unknown";
    fullName = `${first} ${last}`;
    if (attempts++ >= maxAttempts) break;
  } while (usedFullNames.has(fullName));

  usedFullNames.add(fullName);

  return {
    fullName,
    department,
    jobTitle,
    geographicCluster,
    industry,
  };
}

/**
 * Generate N identities for a sandbox. Ensures no duplicate full names.
 */
export function generateEmployeeIdentities(
  count: number,
  options: GenerateOptions,
  usedFullNames: Set<string>
): EmployeeIdentity[] {
  const identities: EmployeeIdentity[] = [];
  for (let i = 0; i < count; i++) {
    identities.push(generateEmployeeIdentity(options, usedFullNames));
  }
  return identities;
}
