/**
 * Admin impersonation. PLATFORM_ADMIN only; state in secure session/cookie.
 * Re-exports from admin-impersonation for enterprise naming.
 */

export {
  getImpersonationContext,
  type ImpersonationContext,
} from "@/lib/admin-impersonation";
