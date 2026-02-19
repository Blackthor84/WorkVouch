"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

/** Row shape for the bar chart (job_id + avg_rating; e.g. from ScenarioJobStatsRow). */
export type EmployerDamageRow = { job_id: string; avg_rating: number };

type Props = {
  data: EmployerDamageRow[];
  title?: string;
};

export function EmployerDamageBarChart({
  data,
  title = "Employer damage",
}: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {title && <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>}
      {!data?.length ? (
        <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">No data</div>
      ) : (
        <BarChart width={600} height={300} data={data}>
          <XAxis dataKey="job_id" hide />
          <YAxis domain={[0, 5]} />
          <Tooltip />
          <Bar dataKey="avg_rating" fill="#f97316" />
        </BarChart>
      )}
    </div>
  );
}
