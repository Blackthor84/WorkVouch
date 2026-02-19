import { getCurrentUserProfile, isEmployer } from "@/lib/auth";
import { getVerticalDashboardConfig } from "@/lib/verticals/dashboard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrustScoreCard } from "@/components/trust-score-card";
import { ProfileStrengthCard } from "@/components/profile";
import { CareerHealthDashboard } from "@/components/employee/CareerHealthDashboard";
import { ProfileVisibilityCard } from "@/components/employee/ProfileVisibilityCard";
import { EmployeeProfileCompletenessCard } from "@/components/employee/EmployeeProfileCompletenessCard";
import { EmployerProfileViewCountCard } from "@/components/employee/EmployerProfileViewCountCard";
import { AccountSafetyCard } from "@/components/employee/AccountSafetyCard";
import { MyResumesCard } from "@/components/dashboard/MyResumesCard";
import {
  UserCircleIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  BriefcaseIcon as JobsIcon,
  DocumentArrowUpIcon,
} from "@heroicons/react/24/outline";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

// Ensure runtime rendering - prevents build-time prerendering
export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function UserDashboardPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = (user as { app_metadata?: { role?: string } } | undefined)?.app_metadata?.role ?? "";
  console.log("ROUTE CHECK", { path: "/dashboard", role });

  if (!user) {
    redirect("/login");
  }
  const roleLower = role.trim().toLowerCase();
  if (roleLower === "admin" || roleLower === "superadmin") {
    redirect("/admin");
  }
  const emailVerified = Boolean((user as { email_confirmed_at?: string | null }).email_confirmed_at);
  if (!emailVerified) {
    redirect("/verify-email");
  }

  // Redirect employers to their dashboard
  const userIsEmployer = await isEmployer();
  if (userIsEmployer) {
    redirect("/employer/dashboard");
  }

  const profile = await getCurrentUserProfile();

  // Normalize profile: convert string | null to string
  const safeProfile = profile
    ? {
        ...profile,
        full_name: profile.full_name ?? "",
        email: profile.email ?? "",
      }
    : null;

  const shortcuts = [
    {
      href: "/upload-resume",
      label: "Upload Resume",
      icon: DocumentArrowUpIcon,
      color:     "bg-blue-100 text-blue-600",
    },
    {
      href: "/profile",
      label: "Profile",
      icon: UserCircleIcon,
      color: "bg-blue-100 text-blue-600",
    },
    {
      href: "/my-jobs",
      label: "Job History",
      icon: BriefcaseIcon,
      color: "bg-purple-100 text-purple-600",
    },
    {
      href: "/coworker-matches",
      label: "Coworker Matches",
      icon: UserGroupIcon,
      color: "bg-orange-100 text-orange-600",
    },
    {
      href: "/messages",
      label: "Messages",
      icon: ChatBubbleLeftRightIcon,
      color: "bg-green-100 text-green-600",
    },
    {
      href: "/jobs",
      label: "Browse Jobs",
      icon: JobsIcon,
      color: "bg-indigo-100 text-indigo-600",
    },
    ...(safeProfile?.industry && getVerticalDashboardConfig(safeProfile.industry)
      ? [
          {
            href: `/dashboard/vertical/${encodeURIComponent(safeProfile.industry)}`,
            label: `${safeProfile.industry} Intelligence`,
            icon: BriefcaseIcon,
            color: "bg-cyan-100 text-cyan-600",
          },
        ]
      : []),
  ];

  // UI renders only real DB data; no mock/fake. Activity from DB or empty state.
  const recentActivity: { id: string; message: string; time: string }[] = [];

  return (
    <main className="flex-1 flex flex-col container mx-auto px-4 py-8 md:py-12 lg:py-16 bg-[#F8FAFC] min-w-0 overflow-x-hidden">
      <div className="w-full flex flex-col space-y-12 md:space-y-16 lg:space-y-20 min-w-0">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">
            Dashboard
          </h1>
          <p className="text-base text-[#64748B] mt-1">
            Welcome back, {safeProfile?.full_name || user.email}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 flex flex-col space-y-12 md:space-y-16 lg:space-y-20 min-w-0">
            {/* Shortcuts */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-[#0F172A] mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {shortcuts.map((shortcut) => {
                  const Icon = shortcut.icon;
                  const isCoworker = shortcut.href === "/coworker-matches";
                  return (
                    <Button
                      key={shortcut.href}
                      id={isCoworker ? "onboarding-invite-coworker" : undefined}
                      href={shortcut.href}
                      variant="ghost"
                      className="h-auto p-4 flex flex-col items-center gap-2"
                    >
                      <div className={`p-3 rounded-xl ${shortcut.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-semibold">
                        {shortcut.label}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </Card>
            {/* Activity Feed */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#0F172A]">
                  Recent Activity
                </h2>
                {recentActivity.length > 0 && (
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-xl bg-slate-50"
                    >
                      <div className="h-2 w-2 rounded-full bg-[#2563EB] mt-2" />
                      <div className="flex-1">
                        <p className="text-sm text-[#334155]">
                          {activity.message}
                        </p>
                        <p className="text-xs text-[#64748B] mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#64748B] py-4 text-center">
                    No activity yet
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col space-y-12 md:space-y-16 lg:space-y-20">
            <div id="onboarding-reputation-score">
              <TrustScoreCard userId={safeProfile?.id || user.id} />
            </div>

            <MyResumesCard />
            <div id="profile-strength">
              <ProfileStrengthCard userId={safeProfile?.id || user.id} />
            </div>

            <div id="career-health">
              <CareerHealthDashboard />
            </div>

            <div id="profile-visibility">
              <ProfileVisibilityCard />
            </div>

            <div id="onboarding-profile">
              <EmployeeProfileCompletenessCard />
            </div>

            <div id="employer-profile-views">
              <EmployerProfileViewCountCard />
            </div>

            <div id="account-safety">
              <AccountSafetyCard />
            </div>

            {/* Action buttons — growth-focused */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-[#0F172A] mb-4">
                Next steps
              </h3>
              <div className="space-y-3">
                <Button href="/profile" variant="secondary" className="w-full justify-start">
                  Add job
                </Button>
                <Button href="/coworker-matches" variant="secondary" className="w-full justify-start">
                  Request confirmation
                </Button>
                <Button href="/profile" variant="secondary" className="w-full justify-start">
                  Improve profile
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
