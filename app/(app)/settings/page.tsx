import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserSettings } from "@/components/settings/user-settings";

// Ensure runtime rendering - prevents build-time prerendering
export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="flex-1 flex flex-col container mx-auto px-4 py-8 md:py-12 lg:py-16 bg-background dark:bg-[#0D1117]">
      <div className="w-full flex flex-col space-y-12 md:space-y-16 lg:space-y-20 max-w-4xl mx-auto">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">
            Settings
          </h1>
          <p className="mt-1 text-sm text-grey-medium dark:text-gray-400">
            Manage your account and privacy settings
          </p>
        </div>
        {/* Settings Content */}
        <div>
          <UserSettings />
        </div>
      </div>
    </div>
  );
}
