export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Access rules for onboarding live in proxy.ts (e.g. super_admin → /admin). */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
