"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

type RadarPoint = { subject: string; value: number };

export function DemoRadarChart({ data }: { data: RadarPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#E5E7EB" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#6B7280", fontSize: 11 }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Score"
            dataKey="value"
            stroke="#2563EB"
            fill="#2563EB"
            fillOpacity={0.35}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #E5E7EB",
              fontSize: "12px",
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DemoBarChart({
  data,
  dataKey = "count",
  nameKey = "skill",
}: {
  data: Record<string, string | number>[];
  dataKey?: string;
  nameKey?: string;
}) {
  const colors = ["#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE"];

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey={nameKey}
            width={100}
            tick={{ fill: "#374151", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #E5E7EB",
              fontSize: "12px",
            }}
          />
          <Bar dataKey={dataKey} radius={[0, 6, 6, 0]} barSize={18}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DemoCompareChart({
  candidates,
}: {
  candidates: { name: string; trustScore: number }[];
}) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={candidates} margin={{ top: 8, bottom: 8 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: "#374151", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #E5E7EB",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="trustScore" radius={[6, 6, 0, 0]} barSize={48}>
            {candidates.map((c) => (
              <Cell
                key={c.name}
                fill={
                  c.trustScore >= 85
                    ? "#059669"
                    : c.trustScore >= 75
                      ? "#2563EB"
                      : "#D97706"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
