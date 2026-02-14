/**
 * Audit when admins access internal analytics. Required for enterprise.
 */

import { NextRequest } from "next/server";
import { writeAdminAuditLog } from "@/lib/admin/audit-enterprise";
import { getAuditRequestMeta } from "@/lib/admin/getAuditRequestMeta";
import { getAdminSandboxModeFromCookies } from "@/lib/sandbox/sandboxContext";

export type AdminForAnalyticsAudit = {
  userId: string;
  email: string | null;
  role: "admin" | "super_admin";
};

/**
 * Log that an admin viewed analytics. Call once per analytics API request (e.g. overview or real-time).
 * Does not throw; log failure is reported but does not block the read (audit table might be down).
 */
export async function logAdminViewedAnalytics(
  admin: AdminForAnalyticsAudit,
  req: NextRequest,
  section: string
): Promise<void> {
  try {
    const meta = getAuditRequestMeta(req);
    const isSandbox = await getAdminSandboxModeFromCookies();
    await writeAdminAuditLog({
      admin_user_id: admin.userId,
      admin_email: admin.email ?? null,
      admin_role: admin.role === "super_admin" ? "superadmin" : "admin",
      action_type: "VIEW_ANALYTICS",
      target_type: "system",
      target_id: null,
      before_state: null,
      after_state: { section },
      reason: `Viewed internal analytics: ${section}`,
      is_sandbox: isSandbox,
      ip_address: meta.ipAddress,
      user_agent: meta.userAgent,
    });
  } catch (e) {
    console.error("[analytics-audit] logAdminViewedAnalytics failed", e);
    // Do not throw: audit failure should not block analytics read (per product decision for view-only)
  }
}
