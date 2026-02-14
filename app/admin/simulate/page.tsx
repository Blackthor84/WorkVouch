import SimulationClient from "./simulation-client";
import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";

export default async function SimulatePage() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) redirect("/login");
  return <SimulationClient />;
}
