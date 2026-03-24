import { connection } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUnreadNotificationCount } from "@/lib/actions/notifications";
import { getPendingReferenceRequestCount } from "@/lib/actions/referenceRequests";
import { getTrustOverview } from "@/lib/actions/trustOverview";
import { WorkVouchLayoutClient } from "@/components/workvouch/WorkVouchLayoutClient";
import { getEffectiveSession } from "@/lib/auth/actingUser";
import { resolveUserRole } from "@/lib/auth/resolveUserRole";
import { needsWorkerVouchOnboarding } from "@/lib/onboarding/needsVouchOnboarding";

export const dynamic = "force-dynamic";

/**
 * Employee app shell only (super_admin → /admin, employer → /enterprise).
 * When impersonating, admin follows the impersonated user's experience (employee UI).
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
  const isImpersonatingSession = session?.isImpersonating ?? false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, profile_photo_url, is_premium")
    .eq("id", effectiveUserId)
    .maybeSingle();

  if (!isImpersonatingSession) {
    const rawRole = (profile as { role?: string | null } | null)?.role;
    const resolved = resolveUserRole({
      role: rawRole,
    });
    console.log("USER ROLE:", rawRole ?? resolved);

    if (resolved === "pending") {
      redirect("/choose-role");
    } else if (resolved === "super_admin" && !pathname.startsWith("/admin")) {
      redirect("/admin");
    } else if (resolved === "employer" && !pathname.startsWith("/enterprise")) {
      redirect("/enterprise");
    }
  }

  const [unreadCount, pendingRequestsCount, trustOverview] = await Promise.all([
    getUnreadNotificationCount(),
    getPendingReferenceRequestCount(),
    getTrustOverview(),
  ]);
  const p = profile as {
    role?: string;
    full_name?: string | null;
    profile_photo_url?: string | null;
    is_premium?: boolean;
  };
  const userInitial = p?.full_name?.trim().charAt(0)?.toUpperCase() ?? user.email?.charAt(0)?.toUpperCase() ?? "?";
  const userEmail = user.email ?? null;

  const needsVouchOnboarding =
    !isImpersonatingSession && (await needsWorkerVouchOnboarding(effectiveUserId));

  return (
    <WorkVouchLayoutClient
      unreadNotificationCount={unreadCount}
      pendingReferenceRequestCount={pendingRequestsCount}
      trustScore={trustOverview.trustScore}
      isPremium={p?.is_premium ?? false}
      userInitial={userInitial}
      userEmail={userEmail}
      profilePhotoUrl={p?.profile_photo_url ?? null}
      needsVouchOnboarding={needsVouchOnboarding}
    >
      {children}
    </WorkVouchLayoutClient>
  );
}
