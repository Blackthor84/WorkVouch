import { admin } from "@/lib/supabase-admin";
import {
  isMissingColumnError,
  isMissingTableError,
  missingColumnFromError,
  type PostgrestErrorLike,
} from "@/lib/supabase/postgrestErrors";

/** Client-side draft when production lacks profiles.industry. */
export const ONBOARDING_INDUSTRY_DRAFT_KEY = "workvouch_onboarding_industry_draft";

export type OnboardingProfileFields = {
  industry: string | null;
  professionalSummary: string;
  verticalMetadata: Record<string, unknown>;
  workerOnboardingLoopCompletedAt: string | null;
  vouchCount: number;
  vouchTier: number;
  createdAt: string | null;
};

export type SaveOnboardingProfileInput = {
  industry?: string;
  professional_summary?: string;
  vertical_metadata?: Record<string, unknown>;
};

export type SaveOnboardingProfileResult = {
  ok: true;
  persisted: {
    industry: boolean;
    professional_summary: boolean;
    vertical_metadata: boolean;
  };
  industry: string | null;
};

const PROFILE_READ_SELECTS = [
  "worker_onboarding_loop_completed_at, created_at, vouch_count, vouch_tier, industry, professional_summary, vertical_metadata",
  "created_at, industry, professional_summary, vertical_metadata",
  "created_at, professional_summary",
  "created_at",
] as const;

async function updateProfilesWithColumnFallback(
  userId: string,
  update: Record<string, unknown>
): Promise<{ error: PostgrestErrorLike; saved: Record<string, unknown> }> {
  let payload = { ...update };
  const saved: Record<string, unknown> = {};

  while (Object.keys(payload).length > 0) {
    const { error } = await admin.from("profiles").update(payload).eq("id", userId);
    if (!error) {
      Object.assign(saved, payload);
      return { error: null, saved };
    }
    if (isMissingColumnError(error)) {
      const column = missingColumnFromError(error);
      if (column && column in payload) {
        delete payload[column];
        continue;
      }
    }
    return { error, saved };
  }

  return { error: null, saved };
}

function industryFromVerticalMetadata(meta: Record<string, unknown> | null | undefined): string | null {
  const value = meta?.industry;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function readIndustryFromEmployeeProfiles(userId: string): Promise<string | null> {
  const { data, error } = await admin
    .from("employee_profiles")
    .select("industry")
    .eq("profile_id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error) || isMissingColumnError(error)) return null;
    throw new Error(error.message ?? "Failed to load employee profile industry");
  }

  const value = (data as { industry?: string | null } | null)?.industry;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function writeIndustryToEmployeeProfiles(userId: string, industry: string): Promise<boolean> {
  const trimmed = industry.trim();
  if (!trimmed) return false;

  const { error } = await admin.from("employee_profiles").upsert(
    {
      profile_id: userId,
      industry: trimmed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id" }
  );

  if (!error) return true;
  if (isMissingTableError(error) || isMissingColumnError(error)) return false;
  throw new Error(error.message ?? "Failed to save employee profile industry");
}

export async function loadOnboardingProfileFields(userId: string): Promise<OnboardingProfileFields> {
  let row: Record<string, unknown> | null = null;

  for (const columns of PROFILE_READ_SELECTS) {
    const { data, error } = await admin.from("profiles").select(columns).eq("id", userId).maybeSingle();
    if (!error) {
      row = (data ?? {}) as Record<string, unknown>;
      break;
    }
    if (isMissingTableError(error)) break;
    if (!isMissingColumnError(error)) {
      throw new Error(error.message ?? "Failed to load onboarding profile");
    }
  }

  const verticalMetadata =
    row?.vertical_metadata && typeof row.vertical_metadata === "object"
      ? (row.vertical_metadata as Record<string, unknown>)
      : {};

  let industry =
    typeof row?.industry === "string" && row.industry.trim()
      ? row.industry.trim()
      : industryFromVerticalMetadata(verticalMetadata);

  if (!industry) {
    industry = await readIndustryFromEmployeeProfiles(userId);
  }

  return {
    industry,
    professionalSummary: typeof row?.professional_summary === "string" ? row.professional_summary : "",
    verticalMetadata,
    workerOnboardingLoopCompletedAt:
      typeof row?.worker_onboarding_loop_completed_at === "string"
        ? row.worker_onboarding_loop_completed_at
        : null,
    vouchCount: Number(row?.vouch_count ?? 0),
    vouchTier: Number(row?.vouch_tier ?? 0),
    createdAt: typeof row?.created_at === "string" ? row.created_at : null,
  };
}

export async function saveOnboardingProfileFields(
  userId: string,
  input: SaveOnboardingProfileInput
): Promise<SaveOnboardingProfileResult> {
  const industryValue =
    typeof input.industry === "string" && input.industry.trim() ? input.industry.trim() : null;

  const profileUpdate: Record<string, unknown> = {};
  if (typeof input.professional_summary === "string") {
    profileUpdate.professional_summary = input.professional_summary.trim();
  }

  const mergedVertical: Record<string, unknown> = {
    ...(input.vertical_metadata ?? {}),
  };
  if (industryValue) mergedVertical.industry = industryValue;

  if (input.vertical_metadata != null || industryValue) {
    profileUpdate.vertical_metadata = mergedVertical;
  }
  if (industryValue) {
    profileUpdate.industry = industryValue;
  }

  const persisted = {
    industry: false,
    professional_summary: false,
    vertical_metadata: false,
  };

  if (Object.keys(profileUpdate).length > 0) {
    const { error, saved } = await updateProfilesWithColumnFallback(userId, profileUpdate);
    if (error && !isMissingColumnError(error) && !isMissingTableError(error)) {
      throw new Error(error.message ?? "Failed to save profile");
    }
    if ("industry" in saved) persisted.industry = true;
    if ("professional_summary" in saved) persisted.professional_summary = true;
    if ("vertical_metadata" in saved) persisted.vertical_metadata = true;
  }

  if (industryValue && !persisted.industry) {
    persisted.industry = await writeIndustryToEmployeeProfiles(userId, industryValue);
  }

  return {
    ok: true,
    persisted,
    industry: industryValue,
  };
}

export async function markWorkerOnboardingLoopComplete(userId: string): Promise<boolean> {
  const { error } = await updateProfilesWithColumnFallback(userId, {
    worker_onboarding_loop_completed_at: new Date().toISOString(),
  });
  if (!error) return true;
  if (isMissingColumnError(error) || isMissingTableError(error)) return false;
  throw new Error(error.message ?? "Failed to mark onboarding complete");
}
