/**
 * Structured audit logging for admin actions. Logs only — no DB writes.
 * Do not log sensitive data (PII, tokens, etc.).
 */

export function logAdminAction({
  adminId,
  action,
  resource,
  requestId,
  metadata,
}: {
  adminId: string;
  action: string;
  resource: string;
  requestId: string;
  metadata?: Record<string, unknown>;
}): void {
  try {
    console.log("[ADMIN_AUDIT]", {
      adminId,
      action,
      resource,
      requestId,
      metadata,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Never throw from audit
  }
}
