import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserNotifications } from "@/lib/actions/notifications";
import { Card } from "@/components/ui/card";
import { NotificationsList } from "@/components/notifications-list";

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    console.log("REDIRECT TRIGGERED IN: app/(app)/notifications/page.tsx");
    redirect("/auth/signin");
  }

  let notifications: any[] = [];
  try {
    notifications = await getUserNotifications();
  } catch (error: any) {
    // If notifications table doesn't exist, return empty array
    console.warn("Notifications table not found:", error.message);
    notifications = [];
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">
          Notifications
        </h1>
        <p className="mt-1 text-sm text-grey-medium dark:text-gray-400">
          Stay updated on your connections and references
        </p>
      </div>
      <NotificationsList notifications={notifications} />
    </main>
  );
}
