/**
 * Single source of truth for admin UI and route permissions.
 * Uses only isAdmin, isSuperAdmin, and profileRole. No UI logic — permissions only.
 */

export type AdminPermissionContext = {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  profileRole: string;
};

/** Full admin (including super admin). */
export function isAdmin(ctx: AdminPermissionContext): boolean {
  return ctx.isAdmin;
}

/** Super admin only. */
export function isSuperAdmin(ctx: AdminPermissionContext): boolean {
  return ctx.isSuperAdmin;
}

/** User has board role (profileRole === "board"). */
export function isBoard(ctx: AdminPermissionContext): boolean {
  return ctx.profileRole === "board";
}

/** May view financials nav and /admin/financials: admin, finance, or board. */
export function canViewFinancials(ctx: AdminPermissionContext): boolean {
  return ctx.isAdmin || ctx.profileRole === "finance" || ctx.profileRole === "board";
}

/** May view board nav and /admin/board: admin or board. */
export function canViewBoard(ctx: AdminPermissionContext): boolean {
  return ctx.isAdmin || ctx.profileRole === "board";
}

/** May access admin area at all: admin, finance, or board. (God mode is handled in layout.) */
export function canAccessAdminArea(ctx: AdminPermissionContext): boolean {
  return ctx.isAdmin || ctx.profileRole === "finance" || ctx.profileRole === "board";
}
