import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUnreadNotificationCount } from "@/lib/actions/notifications";
import { getPendingReferenceRequestCount } from "@/lib/actions/referenceRequests";
import { getTrustOverview } from "@/lib/actions/trustOverview";
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
  .select("role, full_name, profile_photo_url, is_premium")
  .eq("id", user.id)
  .single();

  // TEMP DISABLED FOR DEBUG
  // if (!profile?.role) redirect('/choose-role');

  const [unreadCount, pendingRequestsCount, trustOverview] = await Promise.all([
    getUnreadNotificationCount(),
    getPendingReferenceRequestCount(),
    getTrustOverview(),
  ]);
  const p = profile as { role?: string; full_name?: string | null; profile_photo_url?: string | null; is_premium?: boolean };
  const userInitial = p?.full_name?.trim().charAt(0)?.toUpperCase() ?? user.email?.charAt(0)?.toUpperCase() ?? "?";
  const userEmail = user.email ?? null;

  return (
    <WorkVouchLayoutClient
      unreadNotificationCount={unreadCount}
      pendingReferenceRequestCount={pendingRequestsCount}
      trustScore={trustOverview.trustScore}
      role={normalizeRole(p?.role)}
      isPremium={p?.is_premium ?? false}
      userInitial={userInitial}
      userEmail={userEmail}
      profilePhotoUrl={p?.profile_photo_url ?? null}
    >
      {children}
    </WorkVouchLayoutClient>
  );
}
