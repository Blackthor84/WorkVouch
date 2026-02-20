import { ActivityMonitorPage } from "@/app/admin/sandbox/monitor/ActivityMonitorClient";

export const dynamic = "force-dynamic";

/** Unified simulation activity timeline. Admin-only. */
export default function PlaygroundMonitorPage() {
  return <ActivityMonitorPage />;
}
