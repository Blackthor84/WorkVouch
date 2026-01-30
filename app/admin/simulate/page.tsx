import SimulationClient from "./simulation-client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

export default async function SimulatePage() {
  const session = await getServerSession(authOptions);
  const roles = (session?.user as { roles?: string[] })?.roles ?? [];

  if (!roles.includes("admin") && !roles.includes("superadmin")) {
    return null;
  }

  return <SimulationClient />;
}
