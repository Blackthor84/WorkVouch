import { admin } from "@/lib/supabase-admin";
import { isMissingColumnError, isMissingTableError, type PostgrestErrorLike } from "@/lib/supabase/postgrestErrors";

export type EmploymentClient = {
  from: (table: string) => unknown;
};

export type CandidateEmploymentRow = {
  id: string;
  company_name: string;
  job_title: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  verification_status: string;
};

const EMPLOYMENT_RECORDS_FULL =
  "id, company_name, job_title, start_date, end_date, is_current, verification_status";
const EMPLOYMENT_RECORDS_MINIMAL =
  "id, company_name, job_title, start_date, end_date, verification_status";
const JOBS_COLUMNS =
  "id, company_name, job_title, title, start_date, end_date, is_current, verification_status";

function normalizeVerificationStatus(status: string | null | undefined): string {
  const value = String(status ?? "pending").toLowerCase();
  if (value === "verified") return "verified";
  return value;
}

function mapJobRow(row: Record<string, unknown>): CandidateEmploymentRow {
  const title = String(row.job_title ?? row.title ?? "").trim();
  const endDate = (row.end_date as string | null) ?? null;
  const isCurrent =
    typeof row.is_current === "boolean"
      ? row.is_current
      : endDate == null;
  return {
    id: String(row.id),
    company_name: String(row.company_name ?? ""),
    job_title: title,
    start_date: String(row.start_date ?? ""),
    end_date: endDate,
    is_current: isCurrent,
    verification_status: normalizeVerificationStatus(
      row.verification_status as string | null | undefined
    ),
  };
}

async function loadFromJobs(
  candidateId: string,
  client: EmploymentClient
): Promise<CandidateEmploymentRow[]> {
  const { data, error } = await client
    .from("jobs")
    .select(JOBS_COLUMNS)
    .eq("user_id", candidateId)
    .order("start_date", { ascending: false })
    .limit(50);

  if (error) {
    if (isMissingTableError(error) || isMissingColumnError(error)) return [];
    throw new Error(error.message ?? "Failed to load jobs employment");
  }

  return (data ?? []).map((row) => mapJobRow(row as Record<string, unknown>));
}

async function loadFromEmploymentRecords(
  candidateId: string,
  columns: string,
  client: EmploymentClient
): Promise<{ rows: CandidateEmploymentRow[]; error: PostgrestErrorLike }> {
  const { data, error } = await client
    .from("employment_records")
    .select(columns)
    .eq("user_id", candidateId)
    .order("start_date", { ascending: false })
    .limit(50);

  if (error) {
    return { rows: [], error };
  }

  return {
    rows: (data ?? []).map((row) => mapJobRow(row as Record<string, unknown>)),
    error: null,
  };
}

/**
 * Production-safe employment rows for employer candidate panels.
 * Prefers employment_records; falls back to jobs when table/columns are absent.
 */
export async function loadCandidateEmploymentRows(
  candidateId: string,
  client: EmploymentClient = admin
): Promise<CandidateEmploymentRow[]> {
  const full = await loadFromEmploymentRecords(candidateId, EMPLOYMENT_RECORDS_FULL, client);
  if (!full.error) return full.rows;

  if (isMissingColumnError(full.error)) {
    const minimal = await loadFromEmploymentRecords(candidateId, EMPLOYMENT_RECORDS_MINIMAL, client);
    if (!minimal.error) return minimal.rows;
    if (isMissingTableError(minimal.error) || isMissingColumnError(minimal.error)) {
      return loadFromJobs(candidateId, client);
    }
    throw new Error(minimal.error.message ?? "Failed to load employment records");
  }

  if (isMissingTableError(full.error)) {
    return loadFromJobs(candidateId, client);
  }

  throw new Error(full.error.message ?? "Failed to load employment records");
}

export function computeVerificationCoverage(rows: CandidateEmploymentRow[]): {
  coveragePercent: number;
  verifiedRoles: number;
  totalRoles: number;
} {
  const totalRoles = rows.length;
  const verifiedRoles = rows.filter((r) => r.verification_status === "verified").length;
  const coveragePercent =
    totalRoles > 0 ? Math.round((verifiedRoles / totalRoles) * 100) : 0;
  return { coveragePercent, verifiedRoles, totalRoles };
}
