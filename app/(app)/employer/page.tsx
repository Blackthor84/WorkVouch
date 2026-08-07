import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveUserRole } from "@/lib/auth/resolveUserRole";

export const dynamic = "force-dynamic";

/**
 * Legacy /employer entry — redirect by role.
 * employer → /employer/dashboard
 * employee (and others) → /coworker-matches
 */
export default async function EmployerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const resolved = resolveUserRole({ role: (prof as { role?: string | null } | null)?.role });
  if (resolved === "employer") redirect("/employer/dashboard");
  redirect("/coworker-matches");
}
