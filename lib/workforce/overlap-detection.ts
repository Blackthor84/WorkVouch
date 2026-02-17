/**
 * Overlap detection: same organization, company name match, date range overlap.
 * Produces peer_match_suggestions. Same logic in sandbox and production.
 */

import type { ParsedResumeJson } from "./resume-types";

export interface JobHistoryEntryWithDates {
  company: string;
  start_date: string;
  end_date: string | null;
}

function normalizeCompany(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[,.]/g, "");
}

function parseDate(s: string | null): Date | null {
  if (s == null || s.trim() === "") return null;
  const d = new Date(s.trim());
  return Number.isNaN(d.getTime()) ? null : d;
}

function rangesOverlap(
  start1: string,
  end1: string | null,
  start2: string,
  end2: string | null
): { overlapStart: string; overlapEnd: string } | null {
  const a1 = parseDate(start1)?.getTime();
  const a2 = parseDate(end1)?.getTime() ?? Infinity;
  const b1 = parseDate(start2)?.getTime();
  const b2 = parseDate(end2)?.getTime() ?? Infinity;
  if (a1 == null || b1 == null) return null;
  const start = Math.max(a1, b1);
  const end = Math.min(a2, b2);
  if (start >= end) return null;
  const overlapStartDate = new Date(start);
  const overlapEndDate = new Date(end);
  return {
    overlapStart: overlapStartDate.toISOString().slice(0, 10),
    overlapEnd: overlapEndDate.toISOString().slice(0, 10),
  };
}

/**
 * For one employee's parsed resume job_history, find other employees in the same org
 * whose job history overlaps (same company_normalized, overlapping dates).
 * Returns suggestions: { employeeId, suggestedEmployeeId, company_normalized, overlapStart, overlapEnd }[].
 */
export function computePeerSuggestions(
  sourceEmployeeId: string,
  parsed: ParsedResumeJson,
  otherEmployees: {
    id: string;
    parsedJobHistory: JobHistoryEntryWithDates[];
  }[]
): { suggested_employee_id: string; company_normalized: string; overlap_start: string; overlap_end: string }[] {
  const sourceCompanies = parsed.job_history
    .filter((e) => e.company?.trim())
    .map((e) => ({
      company_normalized: normalizeCompany(e.company),
      start_date: e.start_date,
      end_date: e.end_date,
    }));
  const out: { suggested_employee_id: string; company_normalized: string; overlap_start: string; overlap_end: string }[] = [];
  const seen = new Set<string>();

  for (const other of otherEmployees) {
    if (other.id === sourceEmployeeId) continue;
    for (const src of sourceCompanies) {
      for (const their of other.parsedJobHistory) {
        const theirNorm = normalizeCompany(their.company);
        if (theirNorm !== src.company_normalized) continue;
        const overlap = rangesOverlap(src.start_date, src.end_date, their.start_date, their.end_date);
        if (!overlap) continue;
        const key = `${other.id}:${src.company_normalized}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          suggested_employee_id: other.id,
          company_normalized: src.company_normalized,
          overlap_start: overlap.overlapStart,
          overlap_end: overlap.overlapEnd,
        });
      }
    }
  }
  return out;
}
