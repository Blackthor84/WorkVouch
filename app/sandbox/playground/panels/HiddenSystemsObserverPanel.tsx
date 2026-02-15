"use client";

export type ObserverData = {
  trustDelta?: number;
  culture?: string[];
  signals?: string[];
  abuseRisk?: number;
};

export function HiddenSystemsObserverPanel({
  data,
}: {
  data?: ObserverData;
}) {
  if (!data) {
    return (
      <div style={{ opacity: 0.6, fontStyle: "italic" }}>
        No sandbox data yet.
      </div>
    );
  }

  return (
    <dl style={{ margin: 0 }}>
      <dt>Trust delta</dt>
      <dd>{data.trustDelta ?? "—"}</dd>

      <dt>Culture</dt>
      <dd>{(data.culture ?? []).join(", ") || "—"}</dd>

      <dt>Signals</dt>
      <dd>{(data.signals ?? []).join(", ") || "—"}</dd>

      <dt>Abuse risk</dt>
      <dd>{data.abuseRisk ?? "—"}</dd>
    </dl>
  );
}
