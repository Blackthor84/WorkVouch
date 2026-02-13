import { getSupabaseSession } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RevenueDemoClient from "@/components/admin/RevenueDemoClient";

export const dynamic = "force-dynamic";

export default async function AdminRevenueDemoPage() {
  const { session } = await getSupabaseSession();
  const roles = (session?.user as { roles?: string[] })?.roles ?? [];
  if (!roles.includes("admin") && !roles.includes("superadmin")) {
    redirect("/dashboard");
  }
  return <RevenueDemoClient />;
}
