import { getUserNotifications } from "@/lib/actions/notifications";
import { NotificationsPanel } from "./NotificationsPanel";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const notifications = await getUserNotifications(50);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
        Notifications
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Matches, reference requests, and other updates.
      </p>
      <Suspense fallback={<NotificationsSkeleton />}>
        <NotificationsPanel initialNotifications={notifications} />
      </Suspense>
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <ul className="mt-6 space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <li
          key={i}
          className="rounded-xl border border-slate-200/80 bg-white p-5 animate-pulse"
        >
          <div className="flex gap-4">
            <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/4 rounded bg-slate-200" />
              <div className="h-3 w-full rounded bg-slate-100" />
              <div className="h-3 w-24 rounded bg-slate-100" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
