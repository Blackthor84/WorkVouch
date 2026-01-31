/**
 * Compliance expiry alerts for Security Agency plan.
 * Only used when employer plan_tier === "security_agency".
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

/**
 * Generate compliance alerts for an employer's guard licenses.
 * - expiration_date within 30 days → 30_day_warning (if not already alerted)
 * - expiration_date < today → expired (if not already alerted)
 * Call from cron or after license upload / status change.
 */
export async function generateComplianceAlerts(
  employerId: string
): Promise<{ created: number; error?: string }> {
  const supabase = getSupabaseServer() as any;
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  const in30Str = in30.toISOString().slice(0, 10);
  let created = 0;

  try {
    const { data: licenses } = await supabase
      .from("guard_licenses")
      .select("id, user_id, expiration_date, status")
      .eq("employer_id", employerId)
      .not("expiration_date", "is", null);
    const list = (licenses ?? []) as { id: string; user_id: string | null; expiration_date: string; status: string }[];

    const { data: existing } = await supabase
      .from("compliance_alerts")
      .select("license_id, alert_type")
      .eq("employer_id", employerId)
      .eq("resolved", false);
    const existingSet = new Set(
      ((existing ?? []) as { license_id: string; alert_type: string }[]).map((e) => `${e.license_id}:${e.alert_type}`)
    );

    for (const lic of list) {
      const exp = lic.expiration_date;
      if (exp < today) {
        if (!existingSet.has(`${lic.id}:expired`)) {
          await supabase.from("compliance_alerts").insert({
            employer_id: employerId,
            user_id: lic.user_id,
            license_id: lic.id,
            alert_type: "expired",
            resolved: false,
          });
          created++;
          existingSet.add(`${lic.id}:expired`);
        }
      } else if (exp <= in30Str) {
        if (!existingSet.has(`${lic.id}:30_day_warning`)) {
          await supabase.from("compliance_alerts").insert({
            employer_id: employerId,
            user_id: lic.user_id,
            license_id: lic.id,
            alert_type: "30_day_warning",
            resolved: false,
          });
          created++;
          existingSet.add(`${lic.id}:30_day_warning`);
        }
      }
    }
    return { created };
  } catch (e) {
    console.error("generateComplianceAlerts error:", e);
    return { created, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
