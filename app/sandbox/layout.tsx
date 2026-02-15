import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { isSandboxEnv } from "@/lib/sandbox/env";

export const dynamic = "force-dynamic";

/**
 * /sandbox/* — Only admins. In SANDBOX: never throw; allow render to continue so /sandbox/playground always loads.
 */
export default async function SandboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isSandboxEnv()) {
    try {
      const admin = await getAdminContext();
      if (!admin.isAuthenticated) redirect("/login");
      if (!admin.isAdmin) redirect("/dashboard");
    } catch {
      // SANDBOX: allow render so /sandbox/playground shows even when APIs/tables are broken
      return <>{children}</>;
    }
  } else {
    const admin = await getAdminContext();
    if (!admin.isAuthenticated) redirect("/login");
    if (!admin.isAdmin) redirect("/dashboard");
  }
  return <>{children}</>;
}
