"use client";

export default function ScenarioComparison({ a, b }: any) {
  if (!a || !b) return null;

  return (
    <div className="grid grid-cols-2 gap-4 border rounded p-4">
      <div>
        <h3 className="font-semibold">Scenario A</h3>
        <p>Trust: {a.after?.trustScore}</p>
        <p>Profile: {a.after?.profileStrength}</p>
      </div>
      <div>
        <h3 className="font-semibold">Scenario B</h3>
        <p>Trust: {b.after?.trustScore}</p>
        <p>Profile: {b.after?.profileStrength}</p>
      </div>
    </div>
  );
}
