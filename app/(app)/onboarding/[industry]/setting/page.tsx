import { SettingFormClient } from "./setting-form-client";
import { type Industry } from "@/lib/constants/industries";

// Mark as dynamic to prevent build-time prerendering
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function IndustrySettingStep(props: any) {
  const { industry } = await props.params;

  return (
    <main className="min-h-screen bg-background dark:bg-[#0D1117]">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <SettingFormClient industry={industry} />
      </div>
    </main>
  );
}
