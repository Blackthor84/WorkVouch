/**
 * Shared admin guard for API routes. Uses app auth (Supabase + getAdminContext).
 * Returns session when role is admin or super_admin; otherwise null. Never throws.
 */
export {
  requireAdminForApi,
  assertAdminCanModify,
  type AdminSession,
} from "@/lib/admin/requireAdmin";
