/**
 * Sandbox identity generator. Uses industry name pools; no hardcoded industry switch.
 * Ensures unique full names per sandbox via usedFullNames Set.
 * Weighted department and job title selection (manager vs staff ratio from pool arrays).
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
 * Generate a single employee identity. Uses pool for industry; no duplicate full names in usedFullNames.
 * Caller must pass and mutate usedFullNames (add returned fullName) to enforce uniqueness per sandbox.
 */
export function generateEmployeeIdentity(
  options: GenerateOptions,
  usedFullNames: Set<string>
): EmployeeIdentity {
  const { industry, department: departmentHint } = options;
  const pool = getPool(industry);

  if (!pool) {
    return fallbackIdentity(industry, departmentHint, usedFullNames);
  }

  const firstNames = pool.firstNames;
  const lastNames = pool.lastNames;
  const departments = pool.departments;
  const jobTitles = pool.jobTitles;
  const geographicClusters = pool.geographicClusters;

  const department = departmentHint && departments.includes(departmentHint)
    ? departmentHint
    : pickWeighted(departments);

  const titlesForDept = jobTitles[department];
  const jobTitle = titlesForDept?.length
    ? pickWeighted(titlesForDept)
    : department;

  const geographicCluster = geographicClusters.length
    ? pickWeighted(geographicClusters)
    : "Default";

  const maxAttempts = firstNames.length * lastNames.length * 2;
  let fullName: string;
  let attempts = 0;
  do {
    const first = pickWeighted(firstNames);
    const last = pickWeighted(lastNames);
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
 * Fallback when industry has no pool: generic names, department/title from hint or "General".
 */
function fallbackIdentity(
  industry: string,
  departmentHint: string | undefined,
  usedFullNames: Set<string>
): EmployeeIdentity {
  const firstNames = ["James", "Maria", "David", "Sarah", "Michael", "Jennifer", "Robert", "Linda"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis"];
  const maxAttempts = firstNames.length * lastNames.length * 2;
  let fullName: string;
  let attempts = 0;
  do {
    const first = pickWeighted(firstNames);
    const last = pickWeighted(lastNames);
    fullName = `${first} ${last}`;
    if (attempts++ >= maxAttempts) break;
  } while (usedFullNames.has(fullName));
  usedFullNames.add(fullName);

  return {
    fullName,
    department: departmentHint ?? "General",
    jobTitle: departmentHint ?? "Staff",
    geographicCluster: "Default",
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
