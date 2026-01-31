import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { redirect } from "next/navigation";
import RevenueDemoClient from "@/components/admin/RevenueDemoClient";

export const dynamic = "force-dynamic";

export default async function AdminRevenueDemoPage() {
  const session = await getServerSession(authOptions);
  const roles = (session?.user as { roles?: string[] })?.roles ?? [];
  if (!roles.includes("admin") && !roles.includes("superadmin")) {
    redirect("/dashboard");
  }
  return <RevenueDemoClient />;
}
