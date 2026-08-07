import { redirect } from "next/navigation";

/** Legacy worker dashboard URL — canonical employee dashboard is /dashboard. */
export default function WorkerDashboardPage() {
  redirect("/dashboard");
}
