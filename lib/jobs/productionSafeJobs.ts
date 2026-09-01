import {
  isMissingColumnError,
  isMissingTableError,
  missingColumnFromError,
  type PostgrestErrorLike,
} from "@/lib/supabase/postgrestErrors";

/** Client-side draft when production lacks is_visible_to_employer. */
export const ONBOARDING_JOB_EMPLOYER_HIDDEN_DRAFT_KEY =
  "workvouch_onboarding_job_employer_hidden";

export type JobEmployerVisibility = "hidden" | "visible";

export type JobsTableClient = {
  from: (table: string) => unknown;
};

export const EMPLOYER_VISIBLE_JOBS_OR = {
  is_visible_to_employer: "is_visible_to_employer.eq.true,is_visible_to_employer.is.null",
  is_private: "is_private.eq.false,is_private.is.null",
} as const;

type MutateResult = { data: unknown; error: PostgrestErrorLike };

/**
 * Maps employer visibility intent onto whichever jobs columns exist.
 * hidden: is_visible_to_employer=false OR is_private=true
 * visible: is_visible_to_employer=true OR is_private=false
 */
export function employerVisibilityFields(
  visibility: JobEmployerVisibility
): Record<string, unknown> {
  const visible = visibility === "visible";
  return {
    is_visible_to_employer: visible,
    is_private: !visible,
  };
}

/** Safe default for onboarding-created employment history. */
export function defaultOnboardingJobVisibility(): JobEmployerVisibility {
  return "hidden";
}

export function isJobRowVisibleToEmployers(row: {
  is_visible_to_employer?: boolean | null;
  is_private?: boolean | null;
}): boolean {
  if (typeof row.is_visible_to_employer === "boolean") {
    return row.is_visible_to_employer;
  }
  if (typeof row.is_private === "boolean") {
    return !row.is_private;
  }
  return false;
}

async function mutateWithColumnFallback(
  payload: Record<string, unknown>,
  apply: (row: Record<string, unknown>) => Promise<MutateResult>
): Promise<MutateResult> {
  let current = { ...payload };

  while (Object.keys(current).length > 0) {
    const result = await apply(current);
    if (!result.error) return result;

    if (isMissingColumnError(result.error)) {
      const column = missingColumnFromError(result.error);
      if (column && column in current) {
        delete current[column];
        continue;
      }
    }

    return result;
  }

  return apply({});
}

type JobInsertBuilder = {
  insert: (row: Record<string, unknown>) => {
    select: (columns: string) => { single: () => Promise<MutateResult> };
  };
};

type JobUpdateBuilder = {
  update: (row: Record<string, unknown>) => {
    eq: (column: string, value: unknown) => {
      eq: (column: string, value: unknown) => {
        select: (columns: string) => { single: () => Promise<MutateResult> };
      };
    };
  };
};

export async function insertJobWithColumnFallback(
  client: JobsTableClient,
  row: Record<string, unknown>,
  visibility: JobEmployerVisibility = "hidden",
  select = "id, company_name, job_title, title"
): Promise<MutateResult> {
  const table = client.from("jobs") as JobInsertBuilder;
  const payload = {
    ...row,
    ...employerVisibilityFields(visibility),
  };

  return mutateWithColumnFallback(payload, async (current) =>
    table.insert(current).select(select).single()
  );
}

export async function updateJobWithColumnFallback(
  client: JobsTableClient,
  jobId: string,
  userId: string,
  row: Record<string, unknown>,
  visibility?: JobEmployerVisibility,
  select = "id, company_name, job_title, title"
): Promise<MutateResult> {
  const table = client.from("jobs") as JobUpdateBuilder;
  const payload =
    visibility != null
      ? { ...row, ...employerVisibilityFields(visibility) }
      : { ...row };

  return mutateWithColumnFallback(payload, async (current) =>
    table.update(current).eq("id", jobId).eq("user_id", userId).select(select).single()
  );
}

type JobsSelectChain = {
  in: (column: string, values: string[]) => JobsSelectChain;
  or: (filter: string) => JobsSelectChain;
  order: (column: string, options: { ascending: boolean }) => Promise<MutateResult>;
};

type JobsSelectBuilder = {
  select: (columns: string) => {
    in: (column: string, values: string[]) => JobsSelectChain;
  };
};

export async function queryEmployerVisibleJobs<T extends Record<string, unknown>>(
  client: JobsTableClient,
  userIds: string[],
  select: string,
  orderColumn = "start_date",
  ascending = false
): Promise<{ data: T[]; error: PostgrestErrorLike }> {
  if (userIds.length === 0) {
    return { data: [], error: null };
  }

  const run = async (orFilter: string | null) => {
    let chain = (client.from("jobs") as JobsSelectBuilder)
      .select(select)
      .in("user_id", userIds) as JobsSelectChain;

    if (orFilter) {
      chain = chain.or(orFilter) as JobsSelectChain;
    }

    return chain.order(orderColumn, { ascending });
  };

  const extended = await run(EMPLOYER_VISIBLE_JOBS_OR.is_visible_to_employer);
  if (!extended.error) {
    return { data: (extended.data ?? []) as T[], error: null };
  }

  if (isMissingColumnError(extended.error)) {
    const privateFilter = await run(EMPLOYER_VISIBLE_JOBS_OR.is_private);
    if (!privateFilter.error) {
      return { data: (privateFilter.data ?? []) as T[], error: null };
    }
    if (isMissingColumnError(privateFilter.error) || isMissingTableError(privateFilter.error)) {
      return { data: [], error: null };
    }
    return { data: [], error: privateFilter.error };
  }

  if (isMissingTableError(extended.error)) {
    return { data: [], error: null };
  }

  return { data: [], error: extended.error };
}

export type SaveOnboardingJobInput = {
  userId: string;
  companyName: string;
  role: string;
  startDate: string;
};

export type SaveOnboardingJobResult = {
  ok: true;
  job: {
    id: string;
    company_name: string;
    job_title: string | null;
  };
  visibility: JobEmployerVisibility;
  persistedVisibility: {
    is_visible_to_employer: boolean;
    is_private: boolean;
  };
};

export async function saveOnboardingVouchJob(
  client: JobsTableClient,
  input: SaveOnboardingJobInput
): Promise<{ result: SaveOnboardingJobResult | null; error: PostgrestErrorLike }> {
  const visibility = defaultOnboardingJobVisibility();
  const select = "id, company_name, job_title, title";

  const existing = await (client.from("jobs") as {
    select: (columns: string) => {
      eq: (column: string, value: unknown) => {
        order: (column: string, options: { ascending: boolean }) => {
          limit: (count: number) => {
            maybeSingle: () => Promise<{ data: { id?: string } | null; error: PostgrestErrorLike }>;
          };
        };
      };
    };
  })
    .select("id")
    .eq("user_id", input.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.error && !isMissingTableError(existing.error)) {
    return { result: null, error: existing.error };
  }

  const existingId = existing.data?.id;
  const baseRow = {
    company_name: input.companyName,
    job_title: input.role,
    title: input.role,
  };

  const mutate = existingId
    ? await updateJobWithColumnFallback(
        client,
        existingId,
        input.userId,
        baseRow,
        visibility,
        select
      )
    : await insertJobWithColumnFallback(
        client,
        {
          user_id: input.userId,
          ...baseRow,
          start_date: input.startDate,
          end_date: null,
          is_current: true,
          employment_type: "full_time",
          verification_status: "unverified",
        },
        visibility,
        select
      );

  if (mutate.error) {
    return { result: null, error: mutate.error };
  }

  const job = mutate.data as {
    id: string;
    company_name: string;
    job_title: string | null;
    title: string | null;
  };

  return {
    result: {
      ok: true,
      job: {
        id: job.id,
        company_name: job.company_name,
        job_title: job.job_title ?? job.title,
      },
      visibility,
      persistedVisibility: {
        is_visible_to_employer: visibility === "visible",
        is_private: visibility === "hidden",
      },
    },
    error: null,
  };
}
