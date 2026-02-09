import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfileData } from "@/lib/profile-data";
import { getVerticalDashboardConfig } from "@/lib/verticals/dashboard";
import { VerticalMetricCard } from "@/components/vertical/VerticalMetricCard";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ industry: string }> };

export default async function VerticalDashboardPage({ params }: Props) {
  const { industry: rawIndustry } = await params;
  const industry = decodeURIComponent(rawIndustry ?? "");

  const profile = await getProfileData();
  if (!profile) {
    redirect("/login");
  }

  const config = getVerticalDashboardConfig(industry);

  if (!config || config.length === 0) {
    return (
      <div className="space-y-6 p-6 text-white">
        <h1 className="text-2xl font-bold">{industry || "Vertical"} Intelligence</h1>
        <p>No vertical dashboard available for this industry.</p>
        <Link href="/dashboard" className="text-indigo-400 hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">
          ← Dashboard
        </Link>
      </div>
      <h1 className="text-2xl font-bold">{industry} Intelligence Dashboard</h1>
      <p className="text-slate-400">
        Vertical metrics layered on top of your core score. Your universal score is unchanged.
      </p>

      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        {config.map((metric) => (
          <VerticalMetricCard
            key={metric.key}
            metric={metric}
            value={metric.compute(profile)}
          />
        ))}
      </div>
    </div>
  );
}
