import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Legacy route: redirect to main employer dashboard. */
export default function EmployerDashboardPage() {
  redirect("/employer");
}
