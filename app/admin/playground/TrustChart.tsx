"use client";

type Snapshot = { addedReviews: unknown[] };

export function TrustChart({ history }: { history: Snapshot[] }) {
  if (history.length === 0) return null;

  return (
    <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900 mb-3">Trust Signal Over Time</h2>
      <svg width={400} height={120} className="block">
        {history.map((h: Snapshot, i: number) => {
          const x = i * 40 + 10;
          const y = 100 - (Array.isArray(h.addedReviews) ? h.addedReviews.length : 0) * 10;
          return <circle key={i} cx={x} cy={Math.max(10, y)} r={4} fill="#2563eb" />;
        })}
      </svg>
    </div>
  );
}
