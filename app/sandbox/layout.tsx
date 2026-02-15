import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";

export const dynamic = "force-dynamic";

/**
 * /sandbox/* — Only admins. ENV and role checked on each page (e.g. playground requires SANDBOX).
 */
export default async function SandboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminContext();
  if (!admin.isAuthenticated) redirect("/login");
  if (!admin.isAdmin) redirect("/dashboard");
  return <>{children}</>;
}
