export const dynamic = "force-dynamic";

/**
 * Enterprise shell. Access control is enforced in proxy.ts only.
 * Org routes use EnterpriseOrgShell; marketing/dashboard pages add their own header.
 */
export default function EnterpriseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-wv-bg text-wv-foreground">
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <div className="absolute top-0 left-1/3 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[600px] rounded-full bg-violet-600/10 blur-[90px]" />
      </div>
      <div className="relative z-10">{children}</div>
      {/* SmartGuide available on enterprise surfaces that mount it in header via EnterprisePortalLayout */}
    </div>
  );
}
