/**
 * Intelligence Sandbox — validate and scope sandbox operations.
 * Admin/superadmin only. Production rows (sandbox_id IS NULL) never touched.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { getCurrentUser, getCurrentUserProfile, getCurrentUserRoles } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";

export interface SandboxRow {
  id: string;
  name: string | null;
  created_by: string;
  starts_at: string;
  ends_at: string;
  auto_delete: boolean;
  status: string;
  created_at: string;
}

/**
 * Assert current user is admin/superadmin. For sandbox API routes.
 */
export async function requireSandboxAdmin(): Promise<{ id: string }> {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");
  const [profile, roles] = await Promise.all([getCurrentUserProfile(), getCurrentUserRoles()]);
  const admin = isAdmin(profile?.role ?? null) || roles.some((r) => isAdmin(r));
  if (!admin) throw new Error("Forbidden: admin or superadmin required");
  return { id: user.id };
}

/**
 * Validate sandbox is active and owned by admin. Throws if invalid.
 * Use before any write that tags rows with sandbox_id.
 */
export async function validateSandboxForWrite(
  sandboxId: string,
  adminId: string
): Promise<{ id: string; ends_at: string; starts_at: string }> {
  const supabase = getSupabaseServer();
  const { data: row, error } = await supabase
    .from("intelligence_sandboxes")
    .select("id, starts_at, ends_at, status, created_by")
    .eq("id", sandboxId)
    .eq("created_by", adminId)
    .maybeSingle();

  if (error || !row) throw new Error("Invalid or missing sandbox");
  const r = row as { id: string; starts_at: string; ends_at: string; status: string; created_by: string };
  if (r.status !== "active") throw new Error("Sandbox not active");
  const start = new Date(r.starts_at).getTime();
  const end = new Date(r.ends_at).getTime();
  const now = Date.now();
  if (end <= start) throw new Error("ends_at must be after starts_at");
  if (now >= end) throw new Error("Sandbox expired");
  if (now < start) throw new Error("Sandbox not yet started");
  return { id: r.id, ends_at: r.ends_at, starts_at: r.starts_at };
}
