/**
 * Elite Demo Mode detector.
 * Does NOT modify production data, Supabase, Stripe, or real usage.
 */

export function isEliteDemoEnabled(
  searchParams: URLSearchParams,
  userRole?: string
): boolean {
  const isSecretUrl = searchParams.get("demo") === "elite";
  const isAdmin = userRole === "admin" || userRole === "superadmin";

  if (isAdmin) return true;
  if (process.env.NEXT_PUBLIC_ENABLE_PUBLIC_DEMO === "true" && isSecretUrl) {
    return true;
  }
  return false;
}
