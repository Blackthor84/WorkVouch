import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import HiddenFeaturesClient from "@/components/admin/HiddenFeaturesClient";

export const dynamic = "force-dynamic";

export default async function HiddenFeaturesPage() {
  const ctx = await getAdminContext();
  if (!ctx.authorized) redirect("/login");
  return <HiddenFeaturesClient isSuperAdmin={ctx.isSuperAdmin} />;
}
