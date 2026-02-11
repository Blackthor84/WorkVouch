import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { NavbarServer } from "@/components/navbar-server";
import { getCurrentUserProfile, getCurrentUserRoles } from "@/lib/auth";
import { isAdmin, isSuperAdmin } from "@/lib/roles";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile();
  const roles = await getCurrentUserRoles();
  const role = profile?.role ?? roles[0] ?? null;
  if (!isAdmin(role) && !roles.some((r) => isAdmin(r))) {
    redirect("/dashboard");
  }

  const superAdmin = isSuperAdmin(role) || roles.includes("superadmin");

  return (
    <>
      <NavbarServer />
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex">
        <AdminSidebar isSuperAdmin={superAdmin} />
        <main className="flex-1 min-h-screen overflow-auto">
          {children}
        </main>
      </div>
    </>
  );
}
