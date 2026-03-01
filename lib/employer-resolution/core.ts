import type { EmployerResolutionMatch, EmployerResolutionResult } from "./types";

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[,.]/g, "");
}

/** Simple similarity: 0-100. Exact match = 100; includes = 70; starts with = 50. */
function confidenceScore(input: string, candidate: string): number {
  const a = normalizeName(input);
  const b = normalizeName(candidate);
  if (a === b) return 100;
  if (b.includes(a) || a.includes(b)) return 70;
  if (b.startsWith(a) || a.startsWith(b)) return 50;
  const aWords = a.split(/\s+/).filter(Boolean);
  const bWords = b.split(/\s+/).filter(Boolean);
  const overlap = aWords.filter((w) => bWords.includes(w)).length;
  if (overlap === 0) return 0;
  return Math.min(80, 30 + overlap * 15);
}

export interface EmployerAccountRow {
  id: string;
  company_name: string;
  claimed: boolean;
  claim_verified: boolean;
}

/**
 * Resolve employer name probabilistically. Returns matches with confidence scores.
 * Never auto-verify based on name match alone; status comes from employer_accounts.claimed/claim_verified.
 */
export function resolveEmployerNameFromRows(
  query: string,
  rows: EmployerAccountRow[]
): EmployerResolutionResult {
  const q = query.trim();
  if (!q) return { query: q, matches: [], suggestedMatch: null };

  const matches: EmployerResolutionMatch[] = rows.map((row) => {
    const confidence = confidenceScore(q, row.company_name);
    const status = row.claim_verified
      ? ("claimed_verified" as const)
      : row.claimed
        ? ("pending_claim" as const)
        : ("unclaimed" as const);
    return {
      employerAccountId: row.id,
      companyNameMatched: row.company_name,
      confidenceScore: confidence,
      status,
      inputName: q,
    };
  });

  const sorted = [...matches].sort((a, b) => b.confidenceScore - a.confidenceScore);
  const suggestedMatch =
    sorted.length > 0 && sorted[0].confidenceScore >= 50 ? sorted[0] : null;

  return { query: q, matches: sorted, suggestedMatch };
}
