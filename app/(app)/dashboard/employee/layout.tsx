import { redirect } from "next/navigation";
import { getRoleForRouteGuard } from "@/lib/auth/getRoleForRouteGuard";

export const dynamic = "force-dynamic";

export default async function DashboardEmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getRoleForRouteGuard();
  if (role === null) redirect("/login");
  if (role !== "employee") redirect("/unauthorized");
  return <>{children}</>;
}
