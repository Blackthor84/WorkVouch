import { requireAdmin } from "@/lib/admin/requireAdmin";
import { SandboxV2Client } from "./SandboxV2Client";

export const dynamic = "force-dynamic";

export default async function AdminSandboxV2Page() {
  await requireAdmin();
  return <SandboxV2Client />;
}
