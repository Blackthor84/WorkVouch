import { redirect } from "next/navigation";

/** Legacy employee dashboard alias — canonical route is /dashboard. */
export default function EmployeeDashboardRedirect() {
  redirect("/dashboard");
}
