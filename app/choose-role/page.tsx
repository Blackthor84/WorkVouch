import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChooseRoleForm } from "./ChooseRoleForm";

/**
 * Choose-role lives outside (app) so that router.replace("/dashboard") after saving
 * actually navigates to the protected dashboard instead of staying in the same layout.
 * Auth and role checks: logged-in users without a role see the form; others are redirected.
 */
export default async function ChooseRolePage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  const role = (profile as { role?: string | null } | null)?.role?.trim?.();
  if (role && ["employee", "employer", "admin", "superadmin", "worker", "user"].includes(role.toLowerCase())) {
    redirect("/dashboard");
  }

  return <ChooseRoleForm />;
}
