"use client";

export function ScenarioList({ scenarios, onLoad }: any) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900 mb-3">Saved Scenarios</h2>
      {scenarios.map((s: any) => (
        <div key={s.id} style={{ marginBottom: 8 }}>
          <strong>{s.name}</strong>
          <div>{((s.tags as string[]) || []).join(", ")}</div>
          <button onClick={() => onLoad(s.delta ?? s.simulation_delta)}>Replay</button>
        </div>
      ))}
    </div>
  );
}
