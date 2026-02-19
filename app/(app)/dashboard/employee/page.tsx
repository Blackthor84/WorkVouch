import { redirect } from "next/navigation";

/**
 * Post-login path for role=employee. Canonical employee dashboard is /dashboard/worker.
 */
export default function EmployeeDashboardRedirect() {
  redirect("/dashboard/worker");
}
