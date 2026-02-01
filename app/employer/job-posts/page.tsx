import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { EmployerHeader } from "@/components/employer/employer-header";
import { EmployerSidebar } from "@/components/employer/employer-sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function EmployerJobPostsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const isEmployer = await hasRole("employer");

  if (!isEmployer) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-background dark:bg-[#0D1117]">
      <EmployerSidebar />
      <div className="flex-1 flex flex-col">
        <EmployerHeader />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <Card className="p-8 text-center">
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Verification-focused platform
              </h2>
              <p className="text-grey-medium dark:text-gray-400 mb-4 max-w-md mx-auto">
                WorkVouch focuses on verified work history and references, not job listings. Use Candidates to search and request verifications.
              </p>
              <Button asChild variant="secondary">
                <Link href="/employer/candidates">Search candidates</Link>
              </Button>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
