import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveUserRole } from "@/lib/auth/resolveUserRole";
import { ChooseRoleForm } from "./ChooseRoleForm";

export const dynamic = "force-dynamic";

export default async function ChooseRolePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  const resolved = resolveUserRole({ role: (profile as { role?: string | null } | null)?.role });

  if (resolved === "super_admin") {
    redirect("/admin");
  }
  if (resolved !== "pending") {
    redirect(resolved === "employer" ? "/enterprise" : "/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <ChooseRoleForm />
    </div>
  );
}
