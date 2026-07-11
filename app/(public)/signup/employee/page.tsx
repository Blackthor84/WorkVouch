import { redirect } from "next/navigation";
import { Suspense } from "react";
import SignupEmployeeClient from "./SignupEmployeeClient";

export const dynamic = "force-dynamic";

type SignupEmployeePageProps = {
  searchParams: Promise<{ sandbox?: string; sandboxId?: string }>;
};

/**
 * Production employee registration lives at /signup.
 * This route is reserved for admin sandbox lab flows (?sandbox=true&sandboxId=…).
 */
export default async function SignupEmployeePage({ searchParams }: SignupEmployeePageProps) {
  const params = await searchParams;
  const sandboxId = params.sandboxId?.trim();
  const isSandboxLabRoute = params.sandbox === "true" && !!sandboxId;

  if (!isSandboxLabRoute) {
    redirect("/signup");
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-wv-bg text-wv-muted">Loading…</div>}>
      <SignupEmployeeClient />
    </Suspense>
  );
}
