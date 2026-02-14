/**
 * In-memory admin alerts (no new DB tables). Used for:
 * - Failed admin access attempts
 * - Visible in admin dashboard
 * Ring buffer; never throws.
 */

const MAX_ALERTS = 200;

export type AdminAlertType =
  | "failed_admin_access"
  | "rapid_role_changes"
  | "excessive_impersonation"
  | "after_hours_action";

export type AdminAlert = {
  id: string;
  type: AdminAlertType;
  at: string; // ISO
  email?: string;
  metadata?: Record<string, unknown>;
};

const alerts: AdminAlert[] = [];
let idSeq = 0;

function nextId(): string {
  idSeq += 1;
  return `alert-${Date.now()}-${idSeq}`;
}

/**
 * Record a failed admin access attempt (e.g. non-admin hit /admin or admin API). Never throws.
 */
export function recordFailedAdminAccess(email?: string): void {
  try {
    const entry: AdminAlert = {
      id: nextId(),
      type: "failed_admin_access",
      at: new Date().toISOString(),
      email: email ?? undefined,
    };
    alerts.push(entry);
    if (alerts.length > MAX_ALERTS) alerts.shift();
  } catch {
    // no-op
  }
}

/**
 * Record an anomaly (rapid role changes, excessive impersonation, after-hours). Never throws.
 */
export function recordAdminAnomaly(
  type: "rapid_role_changes" | "excessive_impersonation" | "after_hours_action",
  metadata?: Record<string, unknown>
): void {
  try {
    const entry: AdminAlert = {
      id: nextId(),
      type,
      at: new Date().toISOString(),
      metadata,
    };
    alerts.push(entry);
    if (alerts.length > MAX_ALERTS) alerts.shift();
  } catch {
    // no-op
  }
}

/**
 * Get recent alerts for dashboard. Never throws.
 */
export function getAdminAlerts(limit = 50): AdminAlert[] {
  try {
    return [...alerts].reverse().slice(0, limit);
  } catch {
    return [];
  }
}
