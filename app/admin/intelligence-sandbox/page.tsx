import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { isAdmin } from "@/lib/roles";
import { getCurrentUserProfile, getCurrentUserRoles } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminIntelligenceSandboxPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await getCurrentUserProfile();
  const roles = await getCurrentUserRoles();
  const role = profile?.role ?? roles[0] ?? null;
  if (!isAdmin(role) && !roles.some((r) => isAdmin(r))) redirect("/dashboard");

  redirect("/admin/sandbox");
}
