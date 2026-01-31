/**
 * Universal compliance alert generation.
 * Scans professional_credentials for expiring/expired and creates alerts.
 * Prevents duplicate alerts. No emails — UI only.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

export type GenerateAlertsOptions = {
  /** If set, only process credentials for this employer. */
  employerId?: string;
};

/**
 * Generate compliance alerts from professional_credentials:
 * - expiration_date within 30 days → 30_day_warning (if not already alerted)
 * - expiration_date < today → expired (if not already alerted)
 * Prevents duplicate alerts per credential_id + alert_type (unresolved).
 */
export async function generateComplianceAlerts(
  options: GenerateAlertsOptions = {}
): Promise<{ created: number; errors: string[] }> {
  const supabase = getSupabaseServer() as any;
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  const in30Str = in30.toISOString().slice(0, 10);
  let created = 0;
  const errors: string[] = [];

  try {
    let query = supabase
      .from("professional_credentials")
      .select("id, employer_id, user_id, expiration_date, status")
      .not("expiration_date", "is", null);

    if (options.employerId) {
      query = query.eq("employer_id", options.employerId);
    }
    const { data: credentials, error: fetchError } = await query;

    if (fetchError) {
      errors.push(fetchError.message);
      return { created: 0, errors };
    }

    const list = (credentials ?? []) as {
      id: string;
      employer_id: string;
      user_id: string;
      expiration_date: string;
      status: string;
    }[];

    // Existing unresolved alerts keyed by credential_id:alert_type
    let existingQuery = supabase
      .from("compliance_alerts")
      .select("credential_id, alert_type")
      .not("credential_id", "is", null)
      .eq("resolved", false);
    if (options.employerId) {
      existingQuery = existingQuery.eq("employer_id", options.employerId);
    }
    const { data: existing } = await existingQuery;
    const existingSet = new Set(
      ((existing ?? []) as { credential_id: string; alert_type: string }[]).map(
        (e) => `${e.credential_id}:${e.alert_type}`
      )
    );

    for (const cred of list) {
      const exp = cred.expiration_date;
      if (exp < today) {
        if (!existingSet.has(`${cred.id}:expired`)) {
          const { error: insertError } = await supabase.from("compliance_alerts").insert({
            employer_id: cred.employer_id,
            user_id: cred.user_id,
            credential_id: cred.id,
            license_id: null,
            alert_type: "expired",
            resolved: false,
          });
          if (insertError) errors.push(insertError.message);
          else {
            created++;
            existingSet.add(`${cred.id}:expired`);
          }
        }
      } else if (exp <= in30Str) {
        if (!existingSet.has(`${cred.id}:30_day_warning`)) {
          const { error: insertError } = await supabase.from("compliance_alerts").insert({
            employer_id: cred.employer_id,
            user_id: cred.user_id,
            credential_id: cred.id,
            license_id: null,
            alert_type: "30_day_warning",
            resolved: false,
          });
          if (insertError) errors.push(insertError.message);
          else {
            created++;
            existingSet.add(`${cred.id}:30_day_warning`);
          }
        }
      }
    }
    return { created, errors };
  } catch (e) {
    errors.push(e instanceof Error ? e.message : "Unknown error");
    return { created, errors };
  }
}
