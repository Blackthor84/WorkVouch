import { requireAdmin } from "@/lib/admin/requireAdmin";
import RevenueDemoClient from "@/components/admin/RevenueDemoClient";

export const dynamic = "force-dynamic";

export default async function AdminRevenueDemoPage() {
  await requireAdmin();
  return <RevenueDemoClient />;
}
