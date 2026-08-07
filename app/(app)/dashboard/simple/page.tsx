import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Legacy simple dashboard menu — canonical employee dashboard is /dashboard. */
export default function SimpleDashboardRedirect() {
  redirect("/dashboard");
}
