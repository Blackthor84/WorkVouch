import Link from "next/link";
import { SandboxBanner } from "@/components/workforce/SandboxBanner";
import { EnterpriseOrgSidebarNav } from "./EnterpriseOrgSidebarNav";

type EnterpriseOrgShellProps = {
  orgId: string;
  orgName: string;
  children: React.ReactNode;
};

/** Org-scoped enterprise layout with sidebar navigation. */
export function EnterpriseOrgShell({ orgId, orgName, children }: EnterpriseOrgShellProps) {
  return (
    <div className="relative min-h-screen bg-wv-bg text-wv-foreground overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <div className="absolute top-0 right-1/3 h-[450px] w-[450px] rounded-full bg-indigo-600/10 blur-[100px]" />
      </div>
      <SandboxBanner />
      <div className="relative z-10 flex">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-wv-border bg-wv-surface/80 backdrop-blur-xl md:flex min-h-[calc(100vh-0px)]">
          <div className="border-b border-wv-border px-4 py-4">
            <Link href={`/enterprise/${orgId}/overview`} className="block">
              <p className="text-sm font-bold text-wv-foreground truncate">{orgName}</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-wv-subtle mt-0.5">Organization</p>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <EnterpriseOrgSidebarNav orgId={orgId} />
          </div>
          <div className="border-t border-wv-border p-3">
            <Link
              href="/enterprise"
              className="block rounded-xl px-3 py-2 text-sm font-medium text-wv-muted hover:bg-wv-surface hover:text-wv-foreground transition-colors"
            >
              ← All Organizations
            </Link>
          </div>
        </aside>
        <main className="flex-1 min-w-0 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
