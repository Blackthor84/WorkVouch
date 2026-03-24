import { connection } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveUserRole } from "@/lib/auth/resolveUserRole";
import { getHomePathForResolvedRole } from "@/lib/auth/roleRouting";
import { ChooseRoleForm } from "./ChooseRoleForm";

export const dynamic = "force-dynamic";

export default async function ChooseRolePage() {
  await connection();
  const pathname = (await headers()).get("x-workvouch-pathname") ?? "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  const rawRole = (profile as { role?: string | null } | null)?.role;
  const resolved = resolveUserRole({ role: rawRole });
  console.log("USER ROLE:", rawRole ?? resolved);

  if (resolved !== "pending") {
    const dest = getHomePathForResolvedRole(resolved);
    if (pathname !== dest && !pathname.startsWith(`${dest}/`)) {
      redirect(dest);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <ChooseRoleForm />
    </div>
  );
}
