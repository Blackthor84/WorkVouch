import SimulationClient from "./simulation-client";
import { getSupabaseSession } from "@/lib/supabase/server";

export default async function SimulatePage() {
  const { session } = await getSupabaseSession();
  const roles = (session?.user as { roles?: string[] })?.roles ?? [];

  if (!roles.includes("admin") && !roles.includes("superadmin")) {
    return null;
  }

  return <SimulationClient />;
}
