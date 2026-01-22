import { redirect } from "next/navigation";
import { NavbarServer } from "@/components/navbar-server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

// Mark as dynamic
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function UpgradeSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  return (
    <>
      <NavbarServer />
      <div className="min-h-screen bg-background dark:bg-[#0D1117] flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="mb-6">
            <CheckCircleIcon className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold mb-4 text-grey-dark dark:text-gray-200">
            Upgrade Successful!
          </h1>
          <p className="text-grey-medium dark:text-gray-400 mb-6">
            Your account has been upgraded. You now have access to all
            Professional or Enterprise features.
          </p>
          {searchParams.session_id && (
            <p className="text-xs text-grey-medium dark:text-gray-500 mb-6">
              Session ID: {searchParams.session_id}
            </p>
          )}
          <div className="space-y-3">
            <Link href="/employer/dashboard">
              <Button className="w-full">Go to Dashboard</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="secondary" className="w-full">
                View Plans
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}
