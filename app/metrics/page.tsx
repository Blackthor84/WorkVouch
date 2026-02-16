import { MetricsView } from "./MetricsView";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Platform metrics",
  description: "Aggregated platform metrics — adoption, engagement, trust.",
};

export default function MetricsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">Platform metrics</h1>
        <MetricsView />
      </div>
    </div>
  );
}
