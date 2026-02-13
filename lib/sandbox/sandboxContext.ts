import { cookies } from "next/headers";

export type SandboxContext = {
  enabled: boolean;
  isSuperAdmin: boolean;
};

/**
 * Read-only sandbox state from cookie + role.
 * Safe to import anywhere. Does not modify anything.
 */
export async function getSandboxContext(userRole?: string): Promise<SandboxContext> {
  const cookieStore = await cookies();
  const sandboxCookie = cookieStore.get("sandbox_mode")?.value === "true";

  const isSuperAdmin = userRole === "superadmin";
  const enabled = isSuperAdmin && sandboxCookie;

  return {
    enabled,
    isSuperAdmin,
  };
}
