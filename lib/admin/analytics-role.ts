/**
 * Role-based admin analytics. Single source of truth for view access.
 * Canonical roles: admin | finance | board | sales | marketing | ops | support.
 * No other roles without explicit addition. (board has separate /admin/board dashboard.)
 */

export const ANALYTICS_VIEWS = ["admin", "sales", "marketing", "ops", "support", "finance"] as const;
export type AnalyticsView = (typeof ANALYTICS_VIEWS)[number];

export type AnalyticsRole = "admin" | "sales" | "marketing" | "ops" | "support" | "finance";

const VIEW_BY_ROLE: Record<AnalyticsRole, readonly AnalyticsView[]> = {
  admin: ["admin", "sales", "marketing", "ops", "support", "finance"],
  sales: ["sales"],
  marketing: ["marketing"],
  ops: ["ops"],
  support: ["support"],
  finance: ["finance"],
};

/**
 * Resolve analytics role for the current user. admin/super_admin → "admin".
 * Extend with profiles.role (sales, marketing, ops, support, finance) when present.
 */
export function getAnalyticsRole(profileRole: string | null | undefined): AnalyticsRole {
  const r = (profileRole ?? "").trim().toLowerCase();
  if (r === "sales") return "sales";
  if (r === "marketing") return "marketing";
  if (r === "ops") return "ops";
  if (r === "support") return "support";
  if (r === "finance") return "finance";
  if (r === "admin" || r === "super_admin" || r === "superadmin") return "admin";
  return "admin";
}

export function getAllowedViews(role: AnalyticsRole): AnalyticsView[] {
  return [...(VIEW_BY_ROLE[role] ?? ["admin"])];
}

export function canAccessView(role: AnalyticsRole, view: string): view is AnalyticsView {
  const allowed = getAllowedViews(role);
  return ANALYTICS_VIEWS.includes(view as AnalyticsView) && allowed.includes(view as AnalyticsView);
}

export function getDefaultView(role: AnalyticsRole): AnalyticsView {
  const allowed = getAllowedViews(role);
  return (allowed[0] ?? "admin") as AnalyticsView;
}
