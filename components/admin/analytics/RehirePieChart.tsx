"use client";

import { PieChart, Pie, Cell, Tooltip } from "recharts";

/** Row shape from API: would_rehire + total (playground_scenario_id optional). */
export type RehireByWouldRehireRow = { would_rehire: boolean; total: number };

/** Legacy slice shape for pie (label + value). */
export type RehireSlice = { label: string; value: number; color?: string };

const COLORS = { rehire: "#16a34a", noRehire: "#dc2626" };

type RehireRowInput = RehireByWouldRehireRow | RehireSlice;

function isWouldRehireShape(d: RehireRowInput): d is RehireByWouldRehireRow {
  return "would_rehire" in d && "total" in d;
}

type Props = {
  data: RehireByWouldRehireRow[] | RehireSlice[];
  title?: string;
};

export function RehirePieChart({ data, title = "Rehire distribution" }: Props) {
  if (!data?.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {title && <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>}
        <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">No data</div>
      </div>
    );
  }
  const formatted: { name: string; value: number; fill?: string }[] = isWouldRehireShape(data[0])
    ? [
        { name: "Would Rehire", value: data.find((d) => (d as RehireByWouldRehireRow).would_rehire)?.total ?? 0, fill: COLORS.rehire },
        { name: "Would NOT Rehire", value: data.find((d) => !(d as RehireByWouldRehireRow).would_rehire)?.total ?? 0, fill: COLORS.noRehire },
      ]
    : (data as RehireSlice[]).map((d, i) => ({
        name: d.label,
        value: d.value,
        fill: d.color ?? (i === 0 ? COLORS.rehire : COLORS.noRehire),
      }));

  const total = formatted.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {title && <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>}
        <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">No data</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {title && <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>}
      <PieChart width={300} height={300}>
        <Pie data={formatted} dataKey="value" nameKey="name" outerRadius={100}>
          {formatted.map((_, i) => (
            <Cell key={i} fill={formatted[i].fill ?? COLORS.rehire} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </div>
  );
}
