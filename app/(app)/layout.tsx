import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Single auth + role guard for all routes under (app).
 * 1. Not authenticated → redirect /login
 * 2. No profile role → redirect /choose-role
 * No other file under (app) should perform these redirects.
 */
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

  return children;
}
