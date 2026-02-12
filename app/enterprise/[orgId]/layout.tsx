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
        <aside className="w-56 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 min-h-screen py-4 px-3">
          <Link href={`/enterprise/${orgId}`} className="block font-semibold text-gray-900 dark:text-white mb-4 px-2">
            {org.name}
          </Link>
          <nav className="space-y-0.5">
            {SIDEBAR.map(({ href, label }) => (
              <Link
                key={href}
                href={href === "overview" ? `/enterprise/${orgId}/overview` : `/enterprise/${orgId}/${href}`}
                className="block py-2 px-3 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link href="/enterprise" className="block py-2 px-3 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              ← All Organizations
            </Link>
          </div>
        </aside>
        <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
      </div>
    </div>
  );
}
