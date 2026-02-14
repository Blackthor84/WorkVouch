/**
 * Admin impersonation. PLATFORM_ADMIN only; state in secure session/cookie.
 * Re-exports from admin-impersonation for enterprise naming.
 * Use ImpersonationState and narrow with isImpersonating === true before accessing userId.
 */

export {
  getImpersonationContext,
  type ImpersonationContext,
  type NoImpersonation,
  type ImpersonationState,
} from "@/lib/admin-impersonation";
