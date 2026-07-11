import Link from "next/link";
import { SmartGuide } from "@/components/guidance/SmartGuide";
import { WvButton } from "@/components/wv";

type EnterprisePortalLayoutProps = {
  children: React.ReactNode;
  /** Hide top marketing nav (org shell provides its own chrome) */
  minimal?: boolean;
};

/** Top-level enterprise shell — dark glass header matching employer portal. */
export function EnterprisePortalLayout({ children, minimal = false }: EnterprisePortalLayoutProps) {
  return (
    <div className="relative min-h-screen bg-wv-bg text-wv-foreground overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <div className="absolute top-0 left-1/3 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[600px] rounded-full bg-violet-600/10 blur-[90px]" />
      </div>
      {!minimal && (
        <header className="relative z-20 sticky top-0 border-b border-wv-border bg-wv-surface/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Link href="/enterprise/dashboard" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-md">
                EN
              </span>
              <span className="text-sm font-bold text-wv-foreground">WorkVouch Enterprise</span>
            </Link>
            <nav className="flex flex-wrap items-center justify-end gap-2">
              <WvButton href="/enterprise/dashboard" variant="ghost" size="sm">
                Dashboard
              </WvButton>
              <WvButton href="/employer/candidates" variant="ghost" size="sm">
                Candidates
              </WvButton>
              <WvButton href="/enterprise/team-risk" variant="ghost" size="sm">
                Risk
              </WvButton>
              <WvButton href="/enterprise/upgrade" variant="secondary" size="sm">
                Upgrade
              </WvButton>
              <SmartGuide />
            </nav>
          </div>
        </header>
      )}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
