import { getCurrentUser, getCurrentUserProfile } from "@/lib/auth";
import { CheckCircle, XCircle } from "lucide-react";
import { WvShell, WvCard, WvButton } from "@/components/wv";

export default async function EmployerAccessPage() {
  const user = await getCurrentUser();
  const profile = await getCurrentUserProfile();
  const hasEmployerRole = profile?.role === "employer";

  return (
    <WvShell>
      <div className="max-w-2xl mx-auto py-12 px-4">
        <WvCard glow>
          <h1 className="text-3xl font-bold text-wv-foreground mb-4">Employer Dashboard Access</h1>

          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-wv-border bg-wv-bg/50">
              <div className="flex items-center gap-3 mb-2">
                {hasEmployerRole ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-emerald-400" aria-hidden />
                    <span className="font-semibold text-emerald-300">You have employer access</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 text-red-400" aria-hidden />
                    <span className="font-semibold text-red-300">You don&apos;t have employer access</span>
                  </>
                )}
              </div>
              {user && (
                <p className="text-sm text-wv-muted">Logged in as: {user.email}</p>
              )}
              <p className="text-sm text-wv-muted mt-1">
                Role:{" "}
                {profile?.role === "superadmin"
                  ? "super admin"
                  : profile?.role === "admin"
                  ? "admin"
                  : profile?.role === "employer"
                  ? "employer"
                  : profile?.role ?? "none"}
              </p>
            </div>

            {!hasEmployerRole && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-wv-foreground">How to Get Employer Access</h2>
                <div className="space-y-3 text-wv-muted">
                  <p>
                    To access the employer dashboard, you need the{" "}
                    <code className="px-2 py-1 bg-wv-bg rounded border border-wv-border text-wv-foreground">
                      employer
                    </code>{" "}
                    role assigned to your account.
                  </p>
                  <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10">
                    <h3 className="font-semibold text-blue-300 mb-2">Option 1: Run SQL in Supabase</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-200/90">
                      <li>Go to your Supabase project dashboard</li>
                      <li>Open the SQL Editor</li>
                      <li>
                        Copy SQL from{" "}
                        <code className="px-1 py-0.5 bg-wv-bg rounded">ASSIGN_EMPLOYER_ROLE.sql</code> or{" "}
                        <code className="px-1 py-0.5 bg-wv-bg rounded">FIX_MY_EMPLOYER_ROLE.sql</code>
                      </li>
                      <li>Replace YOUR_EMAIL with your actual email</li>
                      <li>Run the query and refresh this page</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 flex-wrap">
              {hasEmployerRole ? (
                <WvButton href="/employer/dashboard" size="lg">
                  Go to Employer Dashboard
                </WvButton>
              ) : (
                <WvButton href="/dashboard" variant="secondary" size="lg">
                  Back to Dashboard
                </WvButton>
              )}
              <WvButton href="/" variant="ghost" size="lg">
                Home
              </WvButton>
            </div>
          </div>
        </WvCard>
      </div>
    </WvShell>
  );
}
