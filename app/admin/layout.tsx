import { redirect } from "next/navigation";
import Link from "next/link";
import { NavbarServer } from "@/components/navbar-server";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminGlobalBar } from "@/components/admin/AdminGlobalBar";
import { isGodMode } from "@/lib/auth/isGodMode";
import { isSandboxEnv } from "@/lib/sandbox/env";
import {
  canAccessAdminArea,
  canViewFinancials,
  canViewBoard,
} from "@/lib/adminPermissions";
import { supabaseServer } from "@/lib/supabase/server";
import { getAdminOverrideStatus } from "@/lib/admin/overrideStatus";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Admin layout: backend enforcement only. getAdminContext() is source of truth; UI is useless without it.
 * Requires a row in admin_users for the current user (else 404). In SANDBOX: do not call admin APIs here; never throw.
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
    if (isSandboxEnv) {
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
  console.log("ROUTE CHECK", { path: "/admin", role: admin.profileRole });

  if (!admin.isAuthenticated) {
    redirect("/login");
  }
  if (!["admin", "super_admin"].includes(admin.profileRole)) {
    redirect("/unauthorized");
  }
  const sessionLike = { user: { role: admin.isSuperAdmin ? "SUPERADMIN" : admin.isAdmin ? "ADMIN" : "USER" }, godMode: admin.godMode };
  const allowed =
    canAccessAdminArea({
      isAdmin: admin.isAdmin,
      isSuperAdmin: admin.isSuperAdmin,
      profileRole: admin.profileRole,
    }) || isGodMode(sessionLike);
  if (!allowed) {
    redirect("/unauthorized");
  }

  const supabase = await supabaseServer();
  const { data: adminUserRow, error: adminUserError } = await supabase
    .from("admin_users")
    .select("god_mode")
    .eq("user_id", admin.userId)
    .maybeSingle();

  if (adminUserError || !adminUserRow) {
    redirect("/404");
  }

  const env = admin.appEnvironment === "sandbox" ? "SANDBOX" : "PRODUCTION";
  const role = admin.isSuperAdmin ? "SUPERADMIN" : "ADMIN";
  const godModeEnabled = admin.godMode?.enabled ?? adminUserRow.god_mode;
  const overrideStatus = await getAdminOverrideStatus();
  const overrideActive = overrideStatus.active;
  const founderEmail = process.env.FOUNDER_EMAIL?.trim()?.toLowerCase();
  const isFounder = Boolean(
    admin.email && founderEmail && admin.email.trim().toLowerCase() === founderEmail
  );

  return (
    <>
      <NavbarServer />
      {godModeEnabled && (
        <div className="bg-red-600 text-white text-center py-2 font-bold">
          ⚠️ GOD MODE ENABLED — LIVE DATA ACCESS
        </div>
      )}
      <AdminGlobalBar
        env={env}
        role={role}
        email={admin.email}
        isSandbox={isSandboxEnv}
        overrideActive={overrideActive}
        overrideExpiresAt={overrideStatus.expiresAt ?? null}
        isFounder={isFounder}
      />
      <div className={`min-h-screen flex ${isSandboxEnv ? "bg-amber-50/50" : "bg-[#F8FAFC]"}`}>
        <AdminSidebar
          isSuperAdmin={admin.isSuperAdmin}
          isSandbox={isSandboxEnv}
          appEnvironment={admin.appEnvironment}
          overrideActive={overrideActive}
          showFinancials={canViewFinancials({
            isAdmin: admin.isAdmin,
            isSuperAdmin: admin.isSuperAdmin,
            profileRole: admin.profileRole,
          })}
          showBoard={canViewBoard({
            isAdmin: admin.isAdmin,
            isSuperAdmin: admin.isSuperAdmin,
            profileRole: admin.profileRole,
          })}
        />
        <main className="flex-1 min-h-screen overflow-auto text-[#0F172A]">
          {children}
        </main>
      </div>
    </>
  );
}
