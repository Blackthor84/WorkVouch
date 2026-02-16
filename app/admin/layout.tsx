import { redirect } from "next/navigation";
import Link from "next/link";
import { NavbarServer } from "@/components/navbar-server";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminGlobalBar } from "@/components/admin/AdminGlobalBar";
import { GodModeBanner } from "@/components/admin/GodModeBanner";
import { isGodMode } from "@/lib/auth/isGodMode";
import { isSandboxEnv } from "@/lib/sandbox/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Admin layout: backend enforcement only. getAdminContext() is source of truth; UI is useless without it.
 * In SANDBOX: do not call admin APIs here; never throw; rendering must continue even with empty data.
 * Any non-critical fetch must be wrapped: try { ... } catch { return null; }
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let admin;
  try {
    admin = await getAdminContext();
  } catch {
    if (isSandboxEnv()) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-amber-50/50 p-6">
          <div className="text-center text-slate-700">
            <p className="font-semibold">Admin context unavailable</p>
            <p className="mt-2 text-sm">Sandbox degrades gracefully. No production impact.</p>
            <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">Go home</Link>
          </div>
        </div>
      );
    }
    throw new Error("Admin context failed");
  }
  if (!admin.isAuthenticated) {
    redirect("/login");
  }
  const sessionLike = { user: { role: admin.isSuperAdmin ? "SUPERADMIN" : admin.isAdmin ? "ADMIN" : "USER" }, godMode: admin.godMode };
  const canAccessAdmin = admin.isAdmin || admin.profileRole === "finance" || isGodMode(sessionLike);
  if (!canAccessAdmin) {
    redirect("/dashboard");
  }

  const env = admin.isSandbox ? "SANDBOX" : "PRODUCTION";
  const role = admin.isSuperAdmin ? "SUPERADMIN" : "ADMIN";

  return (
    <>
      <NavbarServer />
      {admin.godMode?.enabled && <GodModeBanner environment={env} />}
      <AdminGlobalBar
        env={env}
        role={role}
        email={admin.email}
        isSandbox={admin.isSandbox}
      />
      <div className={`min-h-screen flex ${admin.isSandbox ? "bg-amber-50/50" : "bg-[#F8FAFC]"}`}>
        <AdminSidebar
        isSuperAdmin={admin.isSuperAdmin}
        isSandbox={admin.isSandbox}
        showFinancials={admin.isAdmin || admin.profileRole === "finance" || admin.profileRole === "board"}
        showBoard={admin.isAdmin || admin.profileRole === "board"}
      />
        <main className="flex-1 min-h-screen overflow-auto text-[#0F172A]">
          {children}
        </main>
      </div>
    </>
  );
}
