import { getCurrentUser, getCurrentUserProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default async function EmployerAccessPage() {
  const user = await getCurrentUser();
  const profile = await getCurrentUserProfile();
  const hasEmployerRole = profile?.role === "employer";

  return (
    <div className="min-h-screen bg-background dark:bg-[#0D1117] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-4">
            Employer Dashboard Access
          </h1>

          <div className="space-y-6">
            {/* Status */}
            <div className="p-4 rounded-lg bg-grey-background dark:bg-[#1A1F2B]">
              <div className="flex items-center gap-3 mb-2">
                {hasEmployerRole ? (
                  <>
                    <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      You have employer access
                    </span>
                  </>
                ) : (
                  <>
                    <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      You don't have employer access
                    </span>
                  </>
                )}
              </div>
              {user && (
                <p className="text-sm text-grey-medium dark:text-gray-400">
                  Logged in as: {user.email}
                </p>
              )}
              <p className="text-sm text-grey-medium dark:text-gray-400 mt-1">
                Current roles: {roles.length > 0 ? roles.join(", ") : "none"}
              </p>
            </div>

            {/* Instructions */}
            {!hasEmployerRole && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200">
                  How to Get Employer Access
                </h2>
                <div className="space-y-3 text-grey-medium dark:text-gray-400">
                  <p>
                    To access the employer dashboard, you need to have the{" "}
                    <code className="px-2 py-1 bg-grey-background dark:bg-[#1A1F2B] rounded">
                      employer
                    </code>{" "}
                    role assigned to your account.
                  </p>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                      Option 1: Run SQL in Supabase
                    </h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Go to your Supabase project dashboard</li>
                      <li>Open the SQL Editor</li>
                      <li>
                        Copy and paste the SQL from{" "}
                        <code className="px-1 py-0.5 bg-white dark:bg-[#1A1F2B] rounded">
                          ASSIGN_EMPLOYER_ROLE.sql
                        </code>{" "}
                        or{" "}
                        <code className="px-1 py-0.5 bg-white dark:bg-[#1A1F2B] rounded">
                          FIX_MY_EMPLOYER_ROLE.sql
                        </code>
                      </li>
                      <li>
                        Replace{" "}
                        <code className="px-1 py-0.5 bg-white dark:bg-[#1A1F2B] rounded">
                          YOUR_EMAIL@example.com
                        </code>{" "}
                        with your actual email
                      </li>
                      <li>Run the SQL query</li>
                      <li>Refresh this page</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              {hasEmployerRole ? (
                <Button asChild size="lg" className="flex-1">
                  <Link href="/employer/dashboard">
                    Go to Employer Dashboard
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                >
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="lg">
                <Link href="/">Home</Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
