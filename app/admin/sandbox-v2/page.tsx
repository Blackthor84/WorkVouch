import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { SandboxV2Client } from "./SandboxV2Client";

export const dynamic = "force-dynamic";

export default async function AdminSandboxV2Page() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) redirect("/login");
  return <SandboxV2Client />;
}
