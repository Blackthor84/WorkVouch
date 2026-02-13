import { redirect } from "next/navigation";
import { NavbarServer } from "@/components/navbar-server";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getAdminContext();
  if (!context.authorized) {
    redirect("/login");
  }
  const superAdmin = context.isSuperAdmin;

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
