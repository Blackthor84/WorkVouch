import { cookies } from "next/headers";

export type SandboxContext = {
  enabled: boolean;
  isSuperAdmin: boolean;
};

/**
 * Read admin sandbox mode from cookie. When true, admin actions must use is_sandbox and never touch production rows.
 */
export async function getAdminSandboxModeFromCookies(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("sandbox_mode")?.value === "true";
}

/**
 * Read-only sandbox state from cookie + role.
 * Any admin with sandbox_mode cookie is in sandbox mode; superadmin can always toggle.
 */
export async function getSandboxContext(userRole?: string): Promise<SandboxContext> {
  const sandboxCookie = await getAdminSandboxModeFromCookies();
  const isSuperAdmin = userRole === "superadmin" || userRole === "super_admin";
  const enabled = sandboxCookie;

  return {
    enabled,
    isSuperAdmin,
  };
}
