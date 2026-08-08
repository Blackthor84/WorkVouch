import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";

export default async function EmployerIntegrationsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await hasRole("employer"))) redirect("/dashboard");

  return (
    <EmployerPortalLayout wide>
      <Suspense fallback={<div className="text-wv-muted">Loading…</div>}>{children}</Suspense>
    </EmployerPortalLayout>
  );
}
