import { TradesFormClient } from "./trades-form-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function IndustryTradesStep(props: { params: Promise<{ industry: string }> }) {
  const { industry } = await props.params;

  return (
    <main className="min-h-screen bg-background dark:bg-[#0D1117]">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <TradesFormClient industry={industry} />
      </div>
    </main>
  );
}
