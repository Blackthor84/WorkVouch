/**
 * Automated incident reporting and response.
 * Incidents are immutable. Sandbox and production strictly separated.
 * Every creation and status change is audited (admin_audit_logs + incident_actions).
 */

import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { writeAdminAuditLog } from "@/lib/admin/audit-enterprise";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "open" | "mitigated" | "resolved";
export type IncidentEnvironment = "prod" | "sandbox";

const sb = () => getServiceRoleClient() as any;

/** System actor for automated incident creation (audit log). */
const SYSTEM_ACTOR_ID = "00000000-0000-0000-0000-000000000000";

export type CreateIncidentParams = {
  incident_type: string;
  severity: IncidentSeverity;
  title: string;
  description: string;
  environment: IncidentEnvironment;
  triggered_by?: string | null;
  related_alert_ids?: string[];
  affected_users?: number | null;
  affected_employers?: number | null;
};

export type IncidentRow = {
  id: string;
  incident_type: string;
  severity: string;
  title: string;
  description: string;
  environment: string;
  status: string;
  detected_at: string;
  mitigated_at: string | null;
  resolved_at: string | null;
  triggered_by: string | null;
  related_alert_ids: string[];
  affected_users: number | null;
  affected_employers: number | null;
  created_at: string;
};

export type IncidentActionRow = {
  id: string;
  incident_id: string;
  admin_user_id: string | null;
  admin_role: string | null;
  action_type: string;
  action_metadata: Record<string, unknown>;
  created_at: string;
};

/**
 * Create an incident and log to audit. Called automatically (e.g. from CRITICAL alert) or by playbook.
 * THROWS on insert failure — no silent creation.
 */
export async function createIncident(params: CreateIncidentParams): Promise<string> {
  const supabase = sb();
  const row = {
    incident_type: params.incident_type,
    severity: params.severity,
    title: params.title,
    description: params.description,
    environment: params.environment,
    status: "open",
    triggered_by: params.triggered_by ?? null,
    related_alert_ids: params.related_alert_ids ?? [],
    affected_users: params.affected_users ?? null,
    affected_employers: params.affected_employers ?? null,
  };
  const { data, error } = await supabase.from("incidents").insert(row).select("id").single();
  if (error) throw new Error(`Incident insert failed: ${error.message}`);
  const incidentId = (data as { id: string }).id;

  await supabase.from("incident_actions").insert({
    incident_id: incidentId,
    admin_user_id: null,
    admin_role: "system",
    action_type: "incident_created",
    action_metadata: { triggered_by: params.triggered_by, severity: params.severity },
  });

  try {
    await writeAdminAuditLog({
      admin_user_id: SYSTEM_ACTOR_ID,
      admin_email: null,
      admin_role: "admin",
      action_type: "INCIDENT_CREATED",
      target_type: "system",
      target_id: incidentId,
      before_state: null,
      after_state: { incident_id: incidentId, incident_type: params.incident_type, severity: params.severity, environment: params.environment },
      reason: `Incident created: ${params.title}`,
      is_sandbox: params.environment === "sandbox",
    });
  } catch (e) {
    console.error("[incidents] audit log failed for incident creation", incidentId, e);
  }
  return incidentId;
}

/**
 * Create incident from a CRITICAL (or high-severity) alert. Call after createAlert when severity is critical.
 * Best-effort: does not throw so alert flow is not broken.
 */
export async function createIncidentFromAlert(alertId: string): Promise<string | null> {
  const supabase = sb();
  const { data: alert, error: fetchErr } = await supabase
    .from("admin_alerts")
    .select("id, category, alert_type, severity, title, summary, is_sandbox")
    .eq("id", alertId)
    .single();
  if (fetchErr || !alert) return null;
  const a = alert as { severity: string; category: string; title: string; summary: string; is_sandbox: boolean };
  if (a.severity !== "critical") return null;

  const severityMap: Record<string, IncidentSeverity> = {
    critical: "critical",
    warning: "high",
    info: "medium",
  };
  const incidentSeverity = severityMap[a.severity] ?? "high";
  const environment: IncidentEnvironment = a.is_sandbox ? "sandbox" : "prod";
  try {
    return await createIncident({
      incident_type: a.category,
      severity: incidentSeverity,
      title: a.title,
      description: a.summary,
      environment,
      triggered_by: `alert:${alertId}`,
      related_alert_ids: [alertId],
    });
  } catch (e) {
    console.error("[incidents] createIncidentFromAlert failed", alertId, e);
    return null;
  }
}

/**
 * Update incident status (mitigated or resolved). CRITICAL resolution requires superadmin (enforced in API).
 * Writes incident_actions and admin_audit_logs.
 */
export async function updateIncidentStatus(params: {
  incidentId: string;
  status: "mitigated" | "resolved";
  admin_user_id: string;
  admin_email: string | null;
  admin_role: "admin" | "superadmin";
  is_sandbox: boolean;
  reason: string;
  ip_address?: string | null;
  user_agent?: string | null;
}): Promise<void> {
  const supabase = sb();
  const { data: incident } = await supabase
    .from("incidents")
    .select("id, status, environment, severity")
    .eq("id", params.incidentId)
    .single();
  if (!incident) throw new Error("Incident not found");
  if ((incident as { status: string }).status === "resolved") {
    throw new Error("Incident already resolved");
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    status: params.status,
    ...(params.status === "mitigated" && { mitigated_at: now }),
    ...(params.status === "resolved" && { resolved_at: now }),
  };

  const { error: updateErr } = await supabase
    .from("incidents")
    .update(updates)
    .eq("id", params.incidentId);
  if (updateErr) throw new Error(`Incident update failed: ${updateErr.message}`);

  await supabase.from("incident_actions").insert({
    incident_id: params.incidentId,
    admin_user_id: params.admin_user_id,
    admin_role: params.admin_role,
    action_type: `status_${params.status}`,
    action_metadata: { reason: params.reason },
  });

  await writeAdminAuditLog({
    admin_user_id: params.admin_user_id,
    admin_email: params.admin_email,
    admin_role: params.admin_role,
    action_type: `INCIDENT_${params.status.toUpperCase()}`,
    target_type: "system",
    target_id: params.incidentId,
    before_state: { previous_status: (incident as { status: string }).status },
    after_state: { incident_id: params.incidentId, status: params.status },
    reason: params.reason,
    is_sandbox: params.is_sandbox,
    ip_address: params.ip_address,
    user_agent: params.user_agent,
  });
}

/**
 * Add an action to an incident (mitigation note, response action, escalation). Always audited.
 */
export async function addIncidentAction(params: {
  incidentId: string;
  admin_user_id: string;
  admin_role: string;
  action_type: string;
  action_metadata?: Record<string, unknown>;
  is_sandbox: boolean;
  reason: string;
  ip_address?: string | null;
  user_agent?: string | null;
}): Promise<string> {
  const supabase = sb();
  const { data: incident } = await supabase
    .from("incidents")
    .select("id")
    .eq("id", params.incidentId)
    .single();
  if (!incident) throw new Error("Incident not found");

  const { data: action, error } = await supabase
    .from("incident_actions")
    .insert({
      incident_id: params.incidentId,
      admin_user_id: params.admin_user_id,
      admin_role: params.admin_role,
      action_type: params.action_type,
      action_metadata: params.action_metadata ?? {},
    })
    .select("id")
    .single();
  if (error) throw new Error(`Incident action insert failed: ${error.message}`);

  await writeAdminAuditLog({
    admin_user_id: params.admin_user_id,
    admin_email: null,
    admin_role: params.admin_role === "superadmin" ? "superadmin" : "admin",
    action_type: "INCIDENT_ACTION",
    target_type: "system",
    target_id: params.incidentId,
    before_state: null,
    after_state: { incident_id: params.incidentId, action_type: params.action_type, action_id: (action as { id: string }).id },
    reason: params.reason,
    is_sandbox: params.is_sandbox,
    ip_address: params.ip_address,
    user_agent: params.user_agent,
  });

  return (action as { id: string }).id;
}

/**
 * List incidents. Filter by environment, status, severity.
 */
export async function listIncidents(params: {
  environment?: "prod" | "sandbox";
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  limit?: number;
}): Promise<IncidentRow[]> {
  const supabase = sb();
  let q = supabase
    .from("incidents")
    .select("*")
    .order("detected_at", { ascending: false })
    .limit(Math.min(200, params.limit ?? 50));
  if (params.environment) q = q.eq("environment", params.environment);
  if (params.status) q = q.eq("status", params.status);
  if (params.severity) q = q.eq("severity", params.severity);
  const { data, error } = await q;
  if (error) throw new Error(`Incidents list failed: ${error.message}`);
  return (data ?? []) as IncidentRow[];
}

/**
 * Get one incident with its actions (timeline).
 */
export async function getIncidentWithActions(incidentId: string): Promise<{
  incident: IncidentRow | null;
  actions: IncidentActionRow[];
}> {
  const supabase = sb();
  const [incidentRes, actionsRes] = await Promise.all([
    supabase.from("incidents").select("*").eq("id", incidentId).single(),
    supabase.from("incident_actions").select("*").eq("incident_id", incidentId).order("created_at", { ascending: true }),
  ]);
  return {
    incident: incidentRes.data as IncidentRow | null,
    actions: (actionsRes.data ?? []) as IncidentActionRow[],
  };
}
