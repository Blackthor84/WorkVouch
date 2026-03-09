import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/sidebar";

/**
 * Single auth + role guard for all routes under (app).
 * 1. Not authenticated → redirect /login
 * 2. No profile role → redirect /choose-role
 * No other file under (app) should perform these redirects.
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
  const user = data?.user;

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile?.role) {
    redirect("/choose-role");
  }

  const role = normalizeRole((profile as { role?: string | null })?.role ?? null);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0D1117]">
      <Sidebar role={role} />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
