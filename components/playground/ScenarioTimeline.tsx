"use client";

export default function ScenarioTimeline({ events }: { events: any[] }) {
  if (!events?.length) return null;

  return (
    <div className="border-l-2 pl-4 space-y-4">
      {events.map((e, i) => (
        <div key={i}>
          <p className="text-sm font-semibold">{e.type?.toUpperCase() ?? "EVENT"}</p>
          <p className="text-gray-600">{e.message}</p>
          {typeof e.impact === "number" && (
            <p className={e.impact >= 0 ? "text-green-600" : "text-red-600"}>
              Impact: {e.impact}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
