import SimulationClient from "./simulation-client";
import { requireAdmin } from "@/lib/admin/requireAdmin";

export default async function SimulatePage() {
  await requireAdmin();
  return <SimulationClient />;
}
