import { redirect } from "next/navigation";
import { NavbarServer } from "@/components/navbar-server";
import { requireAdminSafe } from "@/lib/auth/requireAdminSafe";
import { isSuperAdminRole } from "@/lib/auth/roles";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdminSafe();
  if (!admin.ok) {
    redirect("/login");
  }
  const superAdmin = isSuperAdminRole(admin.role);

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
