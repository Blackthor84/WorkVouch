import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSandboxOrg } from "@/lib/env/isSandboxOrg";

/**
 * Demo route: only allow when anonymous (public demo) or sandbox/demo context.
 * Production logged-in users without is_demo or sandbox org must not see demo data.
 */
export default async function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return <>{children}</>;
  }
  const supabase = await createServerSupabase();
  const supabaseAny = supabase as any;
  const { data: profile } = await supabaseAny
    .from("profiles")
    .select("is_demo")
    .eq("id", user.id)
    .single();
  const { data: empUser } = await supabaseAny
    .from("employer_users")
    .select("organization_id")
    .eq("profile_id", user.id)
    .limit(1)
    .maybeSingle();
  let organization: { mode?: string | null } | null = null;
  if (empUser?.organization_id) {
    const { data: org } = await supabaseAny
      .from("organizations")
      .select("mode")
      .eq("id", empUser.organization_id)
      .single();
    if (org) organization = org;
  }
  const userForCheck = profile ? { is_demo: (profile as { is_demo?: boolean }).is_demo } : null;
  if (!isSandboxOrg({ organization, user: userForCheck })) {
    redirect("/");
  }
  return <>{children}</>;
}
