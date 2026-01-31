/**
 * Auto-status logic for professional_credentials.
 * Call on upload, update, and during nightly compliance scan.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

/**
 * Set credential status from expiration_date:
 * - If expiration_date < today → status = 'expired'
 * - Else → status = 'active' (do not override 'suspended')
 */
export async function updateCredentialStatus(
  credentialId: string
): Promise<{ updated: boolean; status?: string; error?: string }> {
  const supabase = getSupabaseServer() as any;
  const today = new Date().toISOString().slice(0, 10);

  try {
    const { data: row, error: fetchError } = await supabase
      .from("professional_credentials")
      .select("id, expiration_date, status")
      .eq("id", credentialId)
      .single();

    if (fetchError || !row) {
      return { updated: false, error: fetchError?.message ?? "Credential not found" };
    }

    const current = row as { expiration_date: string | null; status: string };
    if (current.status === "suspended") {
      return { updated: false, status: "suspended" };
    }

    const newStatus =
      current.expiration_date && current.expiration_date < today ? "expired" : "active";
    if (newStatus === current.status) {
      return { updated: false, status: current.status };
    }

    const { error: updateError } = await supabase
      .from("professional_credentials")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", credentialId);

    if (updateError) {
      return { updated: false, error: updateError.message };
    }
    return { updated: true, status: newStatus };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { updated: false, error: msg };
  }
}

/**
 * Update status for all credentials that have an expiration_date (batch for nightly scan).
 * Returns count updated.
 */
export async function updateAllCredentialStatuses(
  employerId?: string
): Promise<{ updated: number; errors: string[] }> {
  const supabase = getSupabaseServer() as any;
  const today = new Date().toISOString().slice(0, 10);
  let count = 0;
  const errors: string[] = [];

  try {
    let query = supabase
      .from("professional_credentials")
      .select("id, expiration_date, status")
      .not("expiration_date", "is", null)
      .neq("status", "suspended");

    if (employerId) {
      query = query.eq("employer_id", employerId);
    }
    const { data: rows, error: fetchError } = await query;

    if (fetchError) {
      errors.push(fetchError.message);
      return { updated: 0, errors };
    }

    const list = (rows ?? []) as { id: string; expiration_date: string; status: string }[];
    for (const row of list) {
      const newStatus = row.expiration_date < today ? "expired" : "active";
      if (newStatus === row.status) continue;
      const { error: updateError } = await supabase
        .from("professional_credentials")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", row.id);
      if (updateError) errors.push(`${row.id}: ${updateError.message}`);
      else count++;
    }
    return { updated: count, errors };
  } catch (e) {
    errors.push(e instanceof Error ? e.message : "Unknown error");
    return { updated: count, errors };
  }
}
