import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmployerDashboardClient } from "./EmployerDashboardClient";

export const dynamic = "force-dynamic";

export default async function EmployerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile as { role?: string } | null)?.role ?? null;
  if (role !== "employer") {
    redirect("/coworker-matches");
  }

  return <EmployerDashboardClient />;
}
