import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEnterpriseOwner } from "@/lib/enterprise/requireEnterprise";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { SandboxBanner } from "@/components/workforce/SandboxBanner";

export const dynamic = "force-dynamic";

const SIDEBAR = [
  { href: "overview", label: "Overview" },
  { href: "locations", label: "Locations" },
  { href: "employees", label: "Employees" },
  { href: "resume-imports", label: "Resume Imports" },
  { href: "peer-references", label: "Peer References" },
  { href: "analytics", label: "Analytics" },
  { href: "billing", label: "Billing" },
  { href: "admin-controls", label: "Admin Controls" },
] as const;

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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0D1117]">
      <SandboxBanner />
      <div className="flex">
        <aside className="w-56 min-h-screen border-r border-blue-200/80 bg-blue-50 py-4 px-3">
          <Link href={`/enterprise/${orgId}`} className="mb-4 block px-2 font-semibold text-blue-900">
            {org.name}
          </Link>
          <EnterpriseOrgSidebarNav orgId={orgId} />
          <div className="mt-6 border-t border-blue-200/80 pt-4">
            <Link href="/enterprise" className="block rounded-lg px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 hover:text-blue-900">
              ← All Organizations
            </Link>
          </div>
        </aside>
        <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
      </div>
    </div>
  );
}
