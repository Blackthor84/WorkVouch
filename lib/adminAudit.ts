/**
 * Structured audit logging for admin actions. Logs only — no DB writes.
 * Do not log sensitive data (PII, tokens, etc.).
 * Never throws; audit is non-fatal.
 */

export function logAdminAction(payload: {
  adminId?: string;
  action: string;
  resource: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}): void {
  try {
    if (!payload.adminId) return;
    console.log("[ADMIN_AUDIT]", {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[ADMIN_AUDIT_FAILED]", err);
  }
}
