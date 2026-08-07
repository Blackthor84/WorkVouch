import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Legacy warehouse onboarding → canonical /onboarding */
export default function WarehouseOnboardingRedirect() {
  redirect("/onboarding");
}
