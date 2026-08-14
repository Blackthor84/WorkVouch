/**
 * Confirm resume extraction — pending employment + optional profile updates.
 * Resume-derived records remain verification_status = pending; never verified automatically.
 */

import { admin } from "@/lib/supabase-admin";
import type {
  EmploymentConfirmItem,
  IdentityConfirmInput,
  ResumeConfirmResponse,
} from "./types";

export type ConfirmResumeInput = {
  userId: string;
  employment: EmploymentConfirmItem[];
  identity?: IdentityConfirmInput;
  resumePath?: string | null;
  cookieHeader?: string | null;
};

function buildLocationString(city?: string | null, state?: string | null, country?: string | null): string | null {
  const parts = [city, state, country].map((p) => (p ?? "").trim()).filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

type ExistingRow = {
  id: string;
  company_name: string;
  company_normalized: string;
  job_title: string;
  start_date: string;
  end_date: string | null;
};

async function loadExistingEmployment(userId: string): Promise<ExistingRow[]> {
  const { data } = await admin
    .from("employment_records")
    .select("id, company_name, company_normalized, job_title, start_date, end_date")
    .eq("user_id", userId);
  return (data ?? []) as ExistingRow[];
}

function isDuplicateOfExisting(item: EmploymentConfirmItem, existing: ExistingRow[]): string | null {
  const normalized =
    (item.company_normalized ?? item.company_name.trim().toLowerCase()) ||
    item.company_name.trim().toLowerCase();
  const title = item.job_title.trim().toLowerCase();

  for (const ex of existing) {
    const sameCompany =
      ex.company_normalized === normalized ||
      ex.company_name?.trim().toLowerCase() === item.company_name.trim().toLowerCase();
    const sameTitle = ex.job_title.trim().toLowerCase() === title;
    const sameDates = ex.start_date === item.start_date && (ex.end_date ?? null) === (item.end_date ?? null);
    if (sameCompany && (sameTitle || sameDates)) return ex.id;
  }
  return null;
}

export async function confirmResumeExtraction(
  input: ConfirmResumeInput
): Promise<ResumeConfirmResponse> {
  const { userId, employment, identity, cookieHeader } = input;
  const existing = await loadExistingEmployment(userId);

  const insertedIds: string[] = [];
  let skippedCount = 0;
  let updatedCount = 0;

  for (const item of employment) {
    const action = item.duplicate_action ?? "create";
    if (action === "skip") {
      skippedCount += 1;
      continue;
    }

    const company_normalized =
      (item.company_normalized ?? item.company_name.trim().toLowerCase()) ||
      item.company_name.trim().toLowerCase();

    const rowBase = {
      company_name: item.company_name.trim(),
      company_normalized,
      job_title: item.job_title.trim(),
      start_date: item.start_date,
      end_date: item.end_date,
      is_current: item.is_current,
      verification_status: "pending" as const,
      source: "resume" as const,
    };

    if (action === "update" && item.existing_record_id) {
      const { data: updated, error } = await admin
        .from("employment_records")
        .update({
          company_name: rowBase.company_name,
          company_normalized: rowBase.company_normalized,
          job_title: rowBase.job_title,
          start_date: rowBase.start_date,
          end_date: rowBase.end_date,
          is_current: rowBase.is_current,
          verification_status: "pending",
        })
        .eq("id", item.existing_record_id)
        .eq("user_id", userId)
        .select("id")
        .single();

      if (!error && updated) {
        updatedCount += 1;
        insertedIds.push(updated.id);
        continue;
      }
    }

    const dupId =
      item.existing_record_id ??
      (action === "create" ? isDuplicateOfExisting(item, existing) : null);
    if (dupId && action === "create" && !item.existing_record_id) {
      skippedCount += 1;
      continue;
    }

    const { data: row, error } = await admin
      .from("employment_records")
      .insert({
        user_id: userId,
        ...rowBase,
      } as Record<string, unknown>)
      .select("id")
      .single();

    if (error) {
      const { data: fallback, error: fallbackErr } = await admin
        .from("employment_records")
        .insert({
          user_id: userId,
          company_name: rowBase.company_name,
          company_normalized: rowBase.company_normalized,
          job_title: rowBase.job_title,
          start_date: rowBase.start_date,
          end_date: rowBase.end_date,
          is_current: rowBase.is_current,
          verification_status: "pending",
        })
        .select("id")
        .single();

      if (fallbackErr || !fallback) {
        throw new Error("Failed to save employment record.");
      }
      insertedIds.push(fallback.id);
    } else if (row) {
      insertedIds.push(row.id);
    }
  }

  let profileUpdated = false;
  if (identity?.apply) {
    const adminAny = admin as { from: (t: string) => ReturnType<typeof admin.from> };
    const { data: profile } = await adminAny
      .from("profiles")
      .select("full_name, city, state, location")
      .eq("id", userId)
      .single();

    const updates: Record<string, string> = {};
    if (identity.full_name?.trim() && (!profile?.full_name || profile.full_name.trim().length === 0)) {
      updates.full_name = identity.full_name.trim();
    }
    if (identity.city?.trim()) {
      updates.city = identity.city.trim();
    }
    if (identity.state?.trim()) {
      updates.state = identity.state.trim();
    }
    const location = buildLocationString(identity.city, identity.state, identity.country);
    if (location) {
      updates.location = location;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await adminAny.from("profiles").update(updates).eq("id", userId);
      if (!error) profileUpdated = true;
    }
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  for (const recordId of insertedIds) {
    try {
      await fetch(`${baseUrl}/api/match-employment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        body: JSON.stringify({ employment_record_id: recordId }),
      });
    } catch {
      // Non-fatal — matching can be retried
    }
  }

  await admin.from("audit_logs").insert({
    entity_type: "resume_import",
    entity_id: userId,
    changed_by: userId,
    new_value: {
      employment_count: insertedIds.length,
      skipped_count: skippedCount,
      updated_count: updatedCount,
      record_ids: insertedIds,
      profile_updated: profileUpdated,
    } as Record<string, unknown>,
    change_reason: "resume_import_confirmed",
  });

  return {
    success: true,
    record_ids: insertedIds,
    skipped_count: skippedCount,
    updated_count: updatedCount,
    profile_updated: profileUpdated,
    verification_url: "/dashboard?openVerification=1",
  };
}
