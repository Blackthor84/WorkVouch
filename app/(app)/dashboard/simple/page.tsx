import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  BriefcaseIcon,
  UserGroupIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

export default async function SimpleDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    console.log("REDIRECT TRIGGERED IN: app/(app)/dashboard/simple/page.tsx");
    redirect("/auth/signin");
  }

  const menuItems = [
    {
      title: "Profile",
      description: "View and edit your profile",
      icon: UserCircleIcon,
      href: "/dashboard",
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Messages",
      description: "View your messages and notifications",
      icon: ChatBubbleLeftRightIcon,
      href: "/messages",
      color:
        "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    },
    {
      title: "Job History",
      description: "Manage your work history",
      icon: BriefcaseIcon,
      href: "/dashboard#jobs",
      color:
        "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    },
    {
      title: "Coworker Matches",
      description: "Find and connect with coworkers",
      icon: UserGroupIcon,
      href: "/dashboard#connections",
      color:
        "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
    },
    {
      title: "Settings",
      description: "Account and privacy settings",
      icon: Cog6ToothIcon,
      href: "/settings",
      color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
    },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
            Dashboard
          </h1>
          <p className="text-grey-medium dark:text-gray-400">
            Quick access to all your WorkVouch features
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <Button
                  href={item.href}
                  variant="ghost"
                  className="w-full h-full p-0 flex flex-col items-start"
                >
                  <div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl mb-4 ${item.color}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-grey-medium dark:text-gray-400 text-left">
                    {item.description}
                  </p>
                </Button>
              </Card>
            );
          })}
        </div>
    </main>
  );
}
