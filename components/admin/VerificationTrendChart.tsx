"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type VerificationTrendPoint = { date: string; count: number };

interface VerificationTrendChartProps {
  initialData: VerificationTrendPoint[];
}

/**
 * Simple line chart: X = created_at (date), Y = number of verifications.
 * Last 30 days of trust_events where event_type = coworker_verified.
 */
export function VerificationTrendChart({ initialData }: VerificationTrendChartProps) {
  const data = initialData.length > 0 ? initialData : [{ date: "", count: 0 }];

  return (
    <div className="h-[280px] w-full rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickFormatter={(v) => (v ? v.slice(5) : "")}
          />
          <YAxis tick={{ fill: "#64748b", fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            formatter={(value: number) => [value, "Verifications"]}
            labelFormatter={(label) => (label ? `Date: ${label}` : "")}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
