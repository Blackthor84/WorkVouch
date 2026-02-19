"use client";

export type HeatmapCell = {
  would_rehire: boolean;
  intensity: number;
  reputation_score: number;
};

type Props = { data: HeatmapCell[]; title?: string };

export function ReputationHeatmap({ data, title }: Props) {
  if (!data?.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {title && <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>}
        <div className="text-slate-500 text-sm">No data</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {title && <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>}
      <div className="grid grid-cols-10 gap-1">
        {data.map((cell, i) => (
          <div
            key={i}
            className="w-6 h-6"
            style={{
              backgroundColor: cell.would_rehire
                ? `rgba(34,197,94,${cell.intensity})`
                : `rgba(239,68,68,${cell.intensity})`,
            }}
            title={`Reputation: ${cell.reputation_score}`}
          />
        ))}
      </div>
    </div>
  );
}
