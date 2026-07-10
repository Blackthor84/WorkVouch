"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import type { SkillPoint } from "@/lib/demo/demo-center-data";

const tooltipStyle = {
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(10,10,15,0.95)",
  color: "#fff",
  fontSize: "12px",
};

export function DemoRadarChart({ data }: { data: SkillPoint[] }) {
  return (
    <div className="h-72 w-full" role="img" aria-label="Skills radar chart">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
          />
          <Radar
            dataKey="value"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.35}
            strokeWidth={2}
          />
          <Tooltip contentStyle={tooltipStyle} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DemoBarChart({
  data,
  dataKey = "value",
  nameKey = "subject",
}: {
  data: Record<string, string | number>[];
  dataKey?: string;
  nameKey?: string;
}) {
  const colors = ["#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"];

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey={nameKey}
            width={100}
            tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey={dataKey} radius={[0, 6, 6, 0]} barSize={16}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CompareBarChart({
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
            tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
            axisLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="trustScore" radius={[6, 6, 0, 0]} barSize={40}>
            {candidates.map((c) => (
              <Cell
                key={c.name}
                fill={
                  c.trustScore >= 90
                    ? "#10b981"
                    : c.trustScore >= 80
                      ? "#6366f1"
                      : "#f59e0b"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WordCloud({
  words,
  variant = "praise",
}: {
  words: { word: string; count: number }[];
  variant?: "praise" | "concern";
}) {
  const max = Math.max(...words.map((w) => w.count), 1);
  return (
    <div className="flex flex-wrap gap-2">
      {words.map((w) => {
        const scale = 0.75 + (w.count / max) * 0.5;
        return (
          <span
            key={w.word}
            className={
              variant === "praise"
                ? "rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-3 py-1 font-medium"
                : "rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 px-3 py-1 font-medium"
            }
            style={{ fontSize: `${scale}rem` }}
          >
            {w.word}
            <span className="ml-1 opacity-60 text-xs">({w.count})</span>
          </span>
        );
      })}
    </div>
  );
}
