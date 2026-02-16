import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { canViewBoard } from "@/lib/adminPermissions";

export default async function BoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminContext();
  if (!admin.isAuthenticated) {
    redirect("/login");
  }
  const allowed = canViewBoard({
    isAdmin: admin.isAdmin,
    isSuperAdmin: admin.isSuperAdmin,
    profileRole: admin.profileRole,
  });
  if (!allowed) {
    redirect("/admin");
  }
  return <>{children}</>;
}
