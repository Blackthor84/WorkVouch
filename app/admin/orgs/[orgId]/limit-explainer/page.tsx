import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth";
import { LimitExplainerClient } from "./LimitExplainerClient";

export const dynamic = "force-dynamic";

export default async function OrgLimitExplainerPage(props: {
  params: Promise<{ orgId: string }>;
}) {
  const superAdmin = await isSuperAdmin();
  if (!superAdmin) {
    redirect("/admin");
  }

  const { orgId } = await props.params;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        Org limit explainer
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        Plan vs usage, abuse signals, and upgrade recommendation for this organization. Super admin only.
      </p>
      <LimitExplainerClient orgId={orgId} />
    </div>
  );
}
