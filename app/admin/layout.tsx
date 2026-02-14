import { redirect } from "next/navigation";
import { NavbarServer } from "@/components/navbar-server";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminGlobalBar } from "@/components/admin/AdminGlobalBar";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Admin layout: backend enforcement only. getAdminContext() is source of truth; UI is useless without it.
 * Sticky top bar (environment + role). Left sidebar. Right content. Red accent prod, yellow sandbox.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminContext();
  if (!admin.isAuthenticated) {
    redirect("/login");
  }
  if (!admin.isAdmin) {
    redirect("/dashboard");
  }

  const env = admin.isSandbox ? "SANDBOX" : "PRODUCTION";
  const role = admin.isSuperAdmin ? "SUPERADMIN" : "ADMIN";

  return (
    <>
      <NavbarServer />
      <AdminGlobalBar
        env={env}
        role={role}
        email={admin.email}
        isSandbox={admin.isSandbox}
      />
      <div className={`min-h-screen flex ${admin.isSandbox ? "bg-amber-50/50" : "bg-[#F8FAFC]"}`}>
        <AdminSidebar isSuperAdmin={admin.isSuperAdmin} />
        <main className="flex-1 min-h-screen overflow-auto text-[#0F172A]">
          {children}
        </main>
      </div>
    </>
  );
}
