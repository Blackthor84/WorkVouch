import { connection } from "next/server";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SmartGuide } from "@/components/guidance/SmartGuide";
import { getEffectiveSession } from "@/lib/auth/actingUser";
import { resolveUserRole } from "@/lib/auth/resolveUserRole";
export const dynamic = "force-dynamic";

/**
 * Employer / enterprise shell only. No employee or admin UI.
 */
export default async function EnterpriseLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const pathname = (await headers()).get("x-workvouch-pathname") ?? "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const session = await getEffectiveSession();
  const effectiveUserId = session?.effectiveUserId ?? user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", effectiveUserId)
    .maybeSingle();

  if (!session?.isImpersonating) {
    const rawRole = (profile as { role?: string | null } | null)?.role;
    const resolved = resolveUserRole({
      role: rawRole,
    });
    console.log("USER ROLE:", rawRole ?? resolved);

    if (resolved === "pending") {
      redirect("/choose-role");
    } else if (resolved === "super_admin" && !pathname.startsWith("/admin")) {
      redirect("/admin");
    } else if (resolved === "employee" && !pathname.startsWith("/dashboard")) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0D1117]">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/enterprise/dashboard" className="text-lg font-semibold text-gray-900 dark:text-white">
            WorkVouch Enterprise
          </Link>
          <nav className="flex flex-wrap gap-3 sm:gap-4 items-center justify-end">
            <Link
              href="/enterprise/dashboard"
              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Enterprise Dashboard
            </Link>
            <Link
              href="/employer/candidates"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Candidates
            </Link>
            <Link
              href="/enterprise/team-risk"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Risk
            </Link>
            <Link
              href="/enterprise/upgrade"
              className="text-sm font-medium text-amber-700 dark:text-amber-400 hover:underline"
            >
              Upgrade
            </Link>
            <SmartGuide />
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
