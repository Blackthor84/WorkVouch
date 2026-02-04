import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import HiddenFeaturesClient from "@/components/admin/HiddenFeaturesClient";

export const dynamic = "force-dynamic";

export default async function HiddenFeaturesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const roles = (session.user as { roles?: string[] }).roles || [];
  const isAdmin = roles.includes("admin") || roles.includes("superadmin");
  if (!isAdmin) {
    redirect("/dashboard");
  }

  const isSuperAdmin = roles.includes("superadmin");

  return <HiddenFeaturesClient isSuperAdmin={isSuperAdmin} />;
}
