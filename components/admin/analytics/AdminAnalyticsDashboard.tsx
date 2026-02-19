"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RehirePieChart } from "./RehirePieChart";
import { EmployerDamageBarChart } from "./EmployerDamageBarChart";
import { ReputationHeatmap } from "./ReputationHeatmap";
import { useRehireBreakdown, useEmployerDamage, useReputationHeatmap } from "./useScenarioAnalytics";

export type AdminAnalyticsDashboardProps = {
  scenarioId: string | null;
};

export function AdminAnalyticsDashboard({ scenarioId }: AdminAnalyticsDashboardProps) {
  const { data: rehire } = useRehireBreakdown(scenarioId);
  const { data: employerDamage } = useEmployerDamage(scenarioId);
  const { data: heatmap } = useReputationHeatmap(scenarioId);

  return (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Rehire Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <RehirePieChart data={rehire ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employer Damage</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployerDamageBarChart data={employerDamage ?? []} />
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Reputation Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <ReputationHeatmap data={heatmap ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
