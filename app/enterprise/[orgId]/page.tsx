import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OrganizationDashboardPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  redirect(`/enterprise/${orgId}/overview`);
}
