export function hasEnterpriseAccess(userRole: string) {
  return userRole === "admin" || userRole === "enterprise" || userRole === "superadmin";
}
