import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

/**
 * Single auth guard for all routes under (app). Uses supabase.auth.getUser()
 * to verify the token with the auth server (never getSession() on the server).
 * Unauthenticated users → redirect /login. No role yet → redirect /choose-role (outside this layout).
 */
function normalizeRole(role: string | null | undefined): "employee" | "employer" | "admin" | null {
  if (!role) return null;
  const r = role.trim().toLowerCase();
  if (r === "employer") return "employer";
  if (r === "employee" || r === "user" || r === "worker") return "employee";
  if (r === "admin" || r === "superadmin") return "admin";
  return null;
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile();
  const roleRaw = profile?.role ?? null;
  const role = normalizeRole(roleRaw);

  if (!role) {
    redirect("/choose-role");
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0D1117]">
      <Sidebar role={role} />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
