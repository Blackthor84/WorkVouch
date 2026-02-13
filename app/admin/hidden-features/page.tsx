import { requireAdmin } from "@/lib/admin/requireAdmin";
import HiddenFeaturesClient from "@/components/admin/HiddenFeaturesClient";

export const dynamic = "force-dynamic";

export default async function HiddenFeaturesPage() {
  const { profile } = await requireAdmin();
  return <HiddenFeaturesClient isSuperAdmin={profile.role === "superadmin"} />;
}
