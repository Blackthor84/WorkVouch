import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Legacy route: redirect to canonical employer dashboard. */
export default function EmployerDashboardPage() {
  redirect("/employer/dashboard");
}
