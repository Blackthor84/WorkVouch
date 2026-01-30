import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { redirect } from "next/navigation";
import DemoRevenueClient from "./demo-revenue-client";

export default async function AdminDemoRevenuePage() {
  const session = await getServerSession(authOptions);
  const roles = (session?.user as { roles?: string[] })?.roles ?? [];
  if (!roles.includes("admin") && !roles.includes("superadmin")) {
    redirect("/dashboard");
  }
  return <DemoRevenueClient />;
}
