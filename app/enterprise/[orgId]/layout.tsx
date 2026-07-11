import { notFound } from "next/navigation";
import { requireEnterpriseOwner } from "@/lib/enterprise/requireEnterprise";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { EnterpriseOrgShell } from "@/components/enterprise/EnterpriseOrgShell";

export const dynamic = "force-dynamic";

export default async function EnterpriseOrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  await requireEnterpriseOwner(orgId);
  const supabase = getSupabaseServer();
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("id", orgId)
    .single();
  if (!org) notFound();

  return (
    <EnterpriseOrgShell orgId={orgId} orgName={org.name ?? "Organization"}>
      {children}
    </EnterpriseOrgShell>
  );
}
