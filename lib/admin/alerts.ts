/**
 * Admin alerting: create, dispatch, acknowledge, dismiss, silence.
 * Sandbox and production strictly separated. All actions auditable.
 */

import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { writeAdminAuditLog } from "@/lib/admin/audit-enterprise";
import { sendEmail } from "@/lib/utils/sendgrid";

export type AlertCategory = "security" | "trust_safety" | "system" | "sandbox";
export type AlertSeverity = "info" | "warning" | "critical";
export type AlertStatus = "new" | "read" | "acknowledged" | "dismissed" | "escalated";

export type CreateAlertParams = {
  category: AlertCategory;
  alert_type: string;
  severity: AlertSeverity;
  title: string;
  summary: string;
  context?: Record<string, unknown>;
  recommended_action?: string | null;
  is_sandbox: boolean;
  source_ref?: Record<string, unknown>;
  silenced_until?: string | null;
};

export type AdminAlertRow = {
  id: string;
  category: string;
  alert_type: string;
  severity: string;
  title: string;
  summary: string;
  context: Record<string, unknown>;
  recommended_action: string | null;
  is_sandbox: boolean;
  status: string;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  dismissed_by: string | null;
  dismissed_at: string | null;
  silenced_until: string | null;
  escalation_count: number;
  source_ref: Record<string, unknown>;
  created_at: string;
};

const sb = () => getServiceRoleClient() as any;

function getAdminAlertEmails(): string[] {
  const raw =
    process.env.ADMIN_ALERT_EMAILS ??
    process.env.PLATFORM_ADMIN_EMAILS ??
    process.env.ADMIN_EMAIL_ALLOWLIST ??
    "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Create an alert and dispatch notifications (best-effort). Returns alert id.
 * Sandbox alerts never trigger production email/Slack.
 */
export async function createAlert(params: CreateAlertParams): Promise<string> {
  const supabase = sb();
  const row = {
    category: params.category,
    alert_type: params.alert_type,
    severity: params.severity,
    title: params.title,
    summary: params.summary,
    context: params.context ?? {},
    recommended_action: params.recommended_action ?? null,
    is_sandbox: params.is_sandbox,
    source_ref: params.source_ref ?? {},
    silenced_until: params.silenced_until ?? null,
  };
  const { data, error } = await supabase.from("admin_alerts").insert(row).select("id").single();
  if (error) throw new Error(`Alert insert failed: ${error.message}`);
  const alertId = (data as { id: string }).id;
  await dispatchNotifications(alertId).catch((e) => {
    console.error("[alerts] dispatch failed for alert", alertId, e);
  });
  if (params.severity === "critical") {
    const { createIncidentFromAlert } = await import("@/lib/admin/incidents");
    createIncidentFromAlert(alertId).catch((e) => console.error("[alerts] incident creation from alert failed", alertId, e));
  }
  return alertId;
}

/**
 * Dispatch notifications for an alert. Best-effort; logs failures to admin_alert_deliveries.
 * Sandbox alerts: in-app only (no production email/Slack).
 */
export async function dispatchNotifications(alertId: string): Promise<void> {
  const supabase = sb();
  const { data: alert, error: fetchErr } = await supabase
    .from("admin_alerts")
    .select("*")
    .eq("id", alertId)
    .single();
  if (fetchErr || !alert) {
    console.error("[alerts] fetch alert failed", alertId, fetchErr);
    return;
  }
  const a = alert as AdminAlertRow;
  const silenced = a.silenced_until && new Date(a.silenced_until) > new Date();
  if (silenced) return;

  const recordDelivery = async (
    channel: string,
    recipient: string,
    err?: string
  ) => {
    await supabase.from("admin_alert_deliveries").insert({
      alert_id: alertId,
      channel,
      recipient,
      error: err ?? null,
    });
  };

  if (a.severity === "info") {
    await recordDelivery("in_app", "all_admins");
    return;
  }

  if (a.is_sandbox) {
    await recordDelivery("in_app", "sandbox_admins");
    return;
  }

  if (a.severity === "critical") {
    const emails = getAdminAlertEmails();
    const subject = `[WorkVouch CRITICAL] ${a.title}`;
    const html = `
      <p><strong>${a.title}</strong></p>
      <p>${a.summary}</p>
      ${a.recommended_action ? `<p><strong>Recommended action:</strong> ${a.recommended_action}</p>` : ""}
      <p>View in admin: /admin/alerts</p>
    `;
    for (const to of emails) {
      try {
        const result = await sendEmail(to, subject, html);
        await recordDelivery("email", to, result.error ?? undefined);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await recordDelivery("email", to, msg);
      }
    }
    const webhook = process.env.SLACK_ALERT_WEBHOOK_URL;
    if (webhook) {
      try {
        const res = await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `[CRITICAL] ${a.title}`,
            blocks: [
              { type: "section", text: { type: "mrkdwn", text: `*${a.title}*` } },
              { type: "section", text: { type: "mrkdwn", text: a.summary } },
              ...(a.recommended_action
                ? [{ type: "section", text: { type: "mrkdwn", text: `_Action:_ ${a.recommended_action}` } }]
                : []),
            ],
          }),
        });
        if (!res.ok) await recordDelivery("slack", "channel", await res.text());
        else await recordDelivery("slack", "channel");
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await recordDelivery("slack", "channel", msg);
      }
    }
  } else {
    await recordDelivery("in_app", "all_admins");
  }
}

/**
 * Mark alert as read (status = 'read'). No audit log required for read.
 */
export async function markAlertRead(alertId: string): Promise<void> {
  const supabase = sb();
  await supabase.from("admin_alerts").update({ status: "read" }).eq("id", alertId);
}

/**
 * Acknowledge alert. Writes to admin_audit_logs.
 */
export async function acknowledgeAlert(params: {
  alertId: string;
  admin_user_id: string;
  admin_email: string | null;
  admin_role: "admin" | "superadmin";
  is_sandbox: boolean;
}): Promise<void> {
  const supabase = sb();
  const { data: alert } = await supabase
    .from("admin_alerts")
    .select("id, is_sandbox")
    .eq("id", params.alertId)
    .single();
  if (!alert) throw new Error("Alert not found");
  if ((alert as { is_sandbox: boolean }).is_sandbox !== params.is_sandbox) {
    throw new Error("Alert sandbox context does not match");
  }
  await supabase
    .from("admin_alerts")
    .update({
      status: "acknowledged",
      acknowledged_by: params.admin_user_id,
      acknowledged_at: new Date().toISOString(),
    })
    .eq("id", params.alertId);
  await writeAdminAuditLog({
    admin_user_id: params.admin_user_id,
    admin_email: params.admin_email,
    admin_role: params.admin_role,
    action_type: "alert_acknowledged",
    target_type: "system",
    target_id: params.alertId,
    before_state: null,
    after_state: { alert_id: params.alertId },
    reason: "Alert acknowledged",
    is_sandbox: params.is_sandbox,
  });
}

/**
 * Dismiss alert. Writes to admin_audit_logs. Critical may require superadmin (enforced in API).
 */
export async function dismissAlert(params: {
  alertId: string;
  admin_user_id: string;
  admin_email: string | null;
  admin_role: "admin" | "superadmin";
  is_sandbox: boolean;
  reason: string;
}): Promise<void> {
  const supabase = sb();
  const { data: alert } = await supabase
    .from("admin_alerts")
    .select("id, is_sandbox")
    .eq("id", params.alertId)
    .single();
  if (!alert) throw new Error("Alert not found");
  if ((alert as { is_sandbox: boolean }).is_sandbox !== params.is_sandbox) {
    throw new Error("Alert sandbox context does not match");
  }
  const reason = params.reason?.trim() || "Alert dismissed";
  await supabase
    .from("admin_alerts")
    .update({
      status: "dismissed",
      dismissed_by: params.admin_user_id,
      dismissed_at: new Date().toISOString(),
    })
    .eq("id", params.alertId);
  await writeAdminAuditLog({
    admin_user_id: params.admin_user_id,
    admin_email: params.admin_email,
    admin_role: params.admin_role,
    action_type: "alert_dismissed",
    target_type: "system",
    target_id: params.alertId,
    before_state: null,
    after_state: { alert_id: params.alertId },
    reason,
    is_sandbox: params.is_sandbox,
  });
}

/**
 * Silence alert until a time. Superadmin only (enforced in API). Writes to admin_audit_logs.
 */
export async function silenceAlert(params: {
  alertId: string;
  silenced_until: string;
  admin_user_id: string;
  admin_email: string | null;
  admin_role: "admin" | "superadmin";
  is_sandbox: boolean;
  reason: string;
}): Promise<void> {
  if (params.admin_role !== "superadmin") {
    throw new Error("Only superadmin can silence alerts");
  }
  const supabase = sb();
  const { data: alert } = await supabase
    .from("admin_alerts")
    .select("id, is_sandbox")
    .eq("id", params.alertId)
    .single();
  if (!alert) throw new Error("Alert not found");
  await supabase
    .from("admin_alerts")
    .update({ silenced_until: params.silenced_until })
    .eq("id", params.alertId);
  await writeAdminAuditLog({
    admin_user_id: params.admin_user_id,
    admin_email: params.admin_email,
    admin_role: "superadmin",
    action_type: "alert_silenced",
    target_type: "system",
    target_id: params.alertId,
    before_state: null,
    after_state: { alert_id: params.alertId, silenced_until: params.silenced_until },
    reason: params.reason?.trim() || "Alert silenced",
    is_sandbox: params.is_sandbox,
  });
}

/**
 * Create an alert from an abuse signal. Call after inserting into abuse_signals.
 * Best-effort; does not throw (caller may fire-and-forget).
 */
export async function createAlertFromAbuseSignal(params: {
  session_id: string | null;
  signal_type: string;
  severity: number;
  is_sandbox: boolean;
  metadata?: Record<string, unknown>;
  abuse_signal_id?: string;
}): Promise<string | null> {
  const severityMap: AlertSeverity[] = ["info", "warning", "critical"];
  const idx = Math.min(Math.max(0, params.severity - 1), 2);
  const severity = severityMap[idx] ?? "warning";
  const titles: Record<string, string> = {
    rapid_refresh: "Rapid page refresh detected",
    scraping: "Scraping behavior detected",
    multi_account_same_ip: "Multiple accounts from same IP",
    vpn_abuse: "VPN / proxy abuse",
    geo_switch: "Rapid geography switch",
    failed_login_loop: "Failed login loop",
    sandbox_misuse: "Sandbox misuse attempt",
  };
  const title = titles[params.signal_type] ?? `Abuse signal: ${params.signal_type}`;
  const summary = `Security signal (${params.signal_type}) for session. Check Abuse & Security analytics.`;
  const recommended = "Review in Admin → Analytics → Abuse & Security; consider blocking or throttling if repeated.";
  try {
    return await createAlert({
      category: "security",
      alert_type: params.signal_type,
      severity,
      title,
      summary,
      context: {
        session_id: params.session_id,
        ...params.metadata,
      },
      recommended_action: recommended,
      is_sandbox: params.is_sandbox,
      source_ref: params.abuse_signal_id ? { abuse_signal_id: params.abuse_signal_id } : {},
    });
  } catch {
    return null;
  }
}

/**
 * Escalate: increment escalation_count and re-dispatch. Call from cron or after threshold.
 */
export async function escalateAlert(alertId: string): Promise<void> {
  const supabase = sb();
  const { data: alert } = await supabase
    .from("admin_alerts")
    .select("id, status, escalation_count")
    .eq("id", alertId)
    .single();
  if (!alert) return;
  const a = alert as { id: string; status: string; escalation_count: number };
  if (a.status === "dismissed" || a.status === "acknowledged") return;
  await supabase
    .from("admin_alerts")
    .update({
      status: "escalated",
      escalation_count: (a.escalation_count ?? 0) + 1,
    })
    .eq("id", alertId);
  await dispatchNotifications(alertId).catch((e) => console.error("[alerts] escalate dispatch failed", e));
}
