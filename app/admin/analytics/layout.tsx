import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnalyticsBreadcrumb } from "./AnalyticsBreadcrumb";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminContext();
  if (!admin.isAdmin) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin"><Button variant="ghost" size="sm">← Back to Admin</Button></Link>
      </div>
      <AnalyticsBreadcrumb />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Internal Analytics</h1>
        <p className="text-[#334155]">
          Site visits and events. Admin-only, auditable, sandbox-aware. No raw IP; no third-party analytics.
        </p>
      </div>
      {children}
    </div>
  );
}
