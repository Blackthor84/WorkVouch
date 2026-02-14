import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import HiddenFeaturesClient from "@/components/admin/HiddenFeaturesClient";

export const dynamic = "force-dynamic";

export default async function HiddenFeaturesPage() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) redirect("/login");
  return <HiddenFeaturesClient isSuperAdmin={admin.isSuperAdmin} />;
}
