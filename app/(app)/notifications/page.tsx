import { getUserNotifications } from "@/lib/actions/notifications";
import { NotificationsPanel } from "./NotificationsPanel";
import { Suspense } from "react";
import { WvContainer, WvPageHeader, WvSkeleton } from "@/components/wv";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const notifications = await getUserNotifications(50);

  return (
    <WvContainer size="narrow" className="py-8">
      <WvPageHeader
        eyebrow="Activity"
        title="Notifications"
        description="Updates on matches, references, and verifications. Mark items read as you review them."
      />
      <Suspense fallback={<NotificationsSkeleton />}>
        <NotificationsPanel initialNotifications={notifications} />
      </Suspense>
    </WvContainer>
  );
}

function NotificationsSkeleton() {
  return (
    <ul className="mt-6 space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <li key={i}>
          <WvSkeleton className="h-20 w-full" />
        </li>
      ))}
    </ul>
  );
}
