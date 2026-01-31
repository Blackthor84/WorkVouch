import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { redirect } from "next/navigation";
import { checkFeatureAccess } from "@/lib/feature-flags";
import WorkforceRiskClient from "./workforce-risk-client";

export const dynamic = "force-dynamic";

export default async function AdminDemoWorkforceRiskPage() {
  const session = await getServerSession(authOptions);
  const roles = (session?.user as { roles?: string[] })?.roles ?? [];
  const userId = (session?.user as { id?: string })?.id ?? null;

  if (!roles.includes("admin") && !roles.includes("superadmin")) {
    redirect("/dashboard");
  }

  const enabled = await checkFeatureAccess("workforce_risk_dashboard", { userId });
  if (!enabled) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-grey-dark dark:text-gray-200">
          Workforce Risk Dashboard
        </h1>
        <p className="mt-4 text-grey-medium dark:text-gray-400">
          This page is behind the workforce_risk_dashboard feature flag. Enable it for your user or globally to view.
        </p>
      </div>
    );
  }

  return <WorkforceRiskClient />;
}
