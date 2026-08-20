import type { ExtractedEmployment } from "./types";

export type ExistingEmployment = {
  id: string;
  company_name: string;
  company_normalized: string;
  job_title: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  verification_status: string;
};

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

function datesOverlap(
  aStart: string,
  aEnd: string | null,
  bStart: string,
  bEnd: string | null
): boolean {
  const aEndVal = aEnd ?? "9999-12-31";
  const bEndVal = bEnd ?? "9999-12-31";
  return aStart <= bEndVal && bStart <= aEndVal;
}

/** Attach duplicate_of when extracted job likely matches an existing record */
export function attachDuplicateHints(
  extracted: ExtractedEmployment[],
  existing: ExistingEmployment[]
): ExtractedEmployment[] {
  return extracted.map((job) => {
    const jobTitle = normalizeTitle(job.job_title);
    const match = existing.find((ex) => {
      const sameCompany =
        ex.company_normalized === job.company_normalized ||
        normalizeTitle(ex.company_name) === normalizeTitle(job.company_name);
      const sameTitle = normalizeTitle(ex.job_title) === jobTitle;
      const overlapping = datesOverlap(job.start_date, job.end_date, ex.start_date, ex.end_date);
      return sameCompany && (sameTitle || overlapping);
    });

    if (!match) {
      return {
        ...job,
        duplicate_of: null,
        duplicate_match_reason: null,
        duplicate_verification_status: null,
      };
    }

    return {
      ...job,
      duplicate_of: match.id,
      duplicate_match_reason: `Looks like ${match.company_name} — ${match.job_title} (${match.verification_status})`,
      duplicate_verification_status: match.verification_status,
    };
  });
}
