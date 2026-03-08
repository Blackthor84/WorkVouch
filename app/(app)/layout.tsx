import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";
import { getCurrentUserProfile } from "@/lib/auth";
import { ChooseRoleGuard } from "@/components/ChooseRoleGuard";
import Sidebar from "@/components/Sidebar";

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
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile();
  const roleRaw = profile?.role ?? null;
  const role = normalizeRole(roleRaw);

  if (!role) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117]">
        <ChooseRoleGuard>{children}</ChooseRoleGuard>
      </div>
    );
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
