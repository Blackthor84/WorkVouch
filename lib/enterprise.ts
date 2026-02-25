export function hasEnterpriseAccess(userRole: string) {
  return userRole === "enterprise" || userRole === "superadmin";
}
