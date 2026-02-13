import SimulationClient from "./simulation-client";
import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";

export default async function SimulatePage() {
  const ctx = await getAdminContext();
  if (!ctx.authorized) redirect("/login");
  return <SimulationClient />;
}
