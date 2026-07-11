import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";
import { WvCard, WvButton } from "@/components/wv";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function UpgradeSuccessPage(props: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session_id = searchParams?.session_id;

  return (
    <EmployerPortalLayout>
      <div className="flex min-h-[60vh] items-center justify-center">
        <WvCard glow className="max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-4" aria-hidden />
          <h1 className="text-3xl font-bold mb-4 text-wv-foreground">Upgrade Successful!</h1>
          <p className="text-wv-muted mb-6">
            Your account has been upgraded. You now have access to all Professional features.
          </p>
          {session_id && (
            <p className="text-xs text-wv-subtle mb-6">Session ID: {session_id}</p>
          )}
          <div className="space-y-3">
            <WvButton href="/employer/dashboard" className="w-full">
              Go to Dashboard
            </WvButton>
            <WvButton href="/pricing" variant="secondary" className="w-full">
              View Plans
            </WvButton>
          </div>
        </WvCard>
      </div>
    </EmployerPortalLayout>
  );
}
