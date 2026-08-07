import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Legacy route: redirect to canonical employer onboarding. */
export default function EmployerOnboardingRedirectPage() {
  redirect("/employer/onboarding/start");
}
