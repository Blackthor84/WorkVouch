/**
 * Auto-match employment record to employer account by company name.
 * When employee creates/updates employment: normalize company name, find employer_accounts
 * by company_name match; set employment_records.employer_id and optionally notify employer.
 * Does NOT auto-verify (verification_status stays pending).
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

function normalizeCompanyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Find employer_accounts row whose company_name (normalized) equals or closely matches.
 * Fetches candidates by ilike then picks exact normalized match.
 */
export async function findEmployerByCompanyName(normalizedCompanyName: string): Promise<{ id: string } | null> {
  if (!normalizedCompanyName) return null;
  const supabase = getSupabaseServer() as any;
  const pattern = `%${normalizedCompanyName.split(" ").filter(Boolean).join("%")}%`;
  const { data: rows } = await supabase
    .from("employer_accounts")
    .select("id, company_name")
    .ilike("company_name", pattern)
    .limit(20);
  const list = Array.isArray(rows) ? rows : [];
  for (const row of list) {
    const cn = (row as { company_name?: string }).company_name ?? "";
    if (normalizeCompanyName(cn) === normalizedCompanyName) return { id: (row as { id: string }).id };
  }
  if (list.length > 0) return { id: (list[0] as { id: string }).id };
  return null;
}

/**
 * After employment record insert/update: try to link to employer, set employer_id,
 * insert employer notification. Call with service role Supabase.
 */
export async function autoMatchEmployerAfterEmployment(
  employmentId: string,
  companyName: string,
  userId: string
): Promise<{ employerId: string | null; linked: boolean }> {
  const normalized = normalizeCompanyName(companyName);
  const employer = await findEmployerByCompanyName(normalized);
  if (!employer) return { employerId: null, linked: false };

  const supabase = getSupabaseServer() as any;
  const { error: updateErr } = await supabase
    .from("employment_records")
    .update({
      employer_id: employer.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", employmentId);

  if (updateErr) {
    console.error("[autoMatchEmployer] update employment_records.employer_id:", updateErr);
    return { employerId: employer.id, linked: false };
  }

  await supabase.from("employer_notifications").insert({
    employer_id: employer.id,
    type: "employee_listed_company",
    related_user_id: userId,
    related_record_id: employmentId,
    read: false,
  });

  const { recalculateMatchConfidence } = await import("./matchConfidence");
  recalculateMatchConfidence(employmentId).catch((e) => console.error("[autoMatchEmployer] recalculateMatchConfidence:", e));

  return { employerId: employer.id, linked: true };
}
