export const dynamic = "force-dynamic";

/** Role checks for this segment are enforced in proxy.ts only. */
export default function DashboardEmployeeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
