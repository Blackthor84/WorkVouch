import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUnreadNotificationCount } from "@/lib/actions/notifications";
import { WorkVouchLayoutClient } from "@/components/workvouch/WorkVouchLayoutClient";

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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, profile_photo_url")
    .eq("id", user.id)
    .single();

  if (!profile?.role) {
    redirect("/choose-role");
  }

  const unreadCount = await getUnreadNotificationCount();
  const p = profile as { role?: string; full_name?: string | null; profile_photo_url?: string | null };
  const userInitial = p?.full_name?.trim().charAt(0)?.toUpperCase() ?? user.email?.charAt(0)?.toUpperCase() ?? "?";
  const userEmail = user.email ?? null;

  return (
    <WorkVouchLayoutClient
      unreadNotificationCount={unreadCount}
      userInitial={userInitial}
      userEmail={userEmail}
      profilePhotoUrl={p?.profile_photo_url ?? null}
    >
      {children}
    </WorkVouchLayoutClient>
  );
}
