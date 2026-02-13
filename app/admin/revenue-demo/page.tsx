import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import RevenueDemoClient from "@/components/admin/RevenueDemoClient";

export const dynamic = "force-dynamic";

export default async function AdminRevenueDemoPage() {
  const ctx = await getAdminContext();
  if (!ctx.authorized) redirect("/login");
  return <RevenueDemoClient />;
}
