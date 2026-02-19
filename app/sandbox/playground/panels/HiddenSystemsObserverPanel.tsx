"use client";

export type ObserverData = {
  trustDelta?: number;
  culture?: string[];
  signals?: string[];
  abuseRisk?: number;
  reputation_changes?: { employee_id: string; delta: number; label?: string }[];
  abuse_flags?: { id: string; signal_type: string; severity: number; created_at: string }[];
  risk_signals?: string[];
  trust_scores?: { employee_id: string; score: number }[];
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

  const rep = data.reputation_changes ?? [];
  const flags = data.abuse_flags ?? [];
  const risks = data.risk_signals ?? [];
  const trust = data.trust_scores ?? [];

  return (
    <dl style={{ margin: 0, fontSize: 13 }}>
      <dt style={{ marginTop: 8, fontWeight: 600 }}>Trust delta</dt>
      <dd style={{ marginLeft: 0 }}>{data.trustDelta ?? "—"}</dd>

      <dt style={{ marginTop: 8, fontWeight: 600 }}>Culture</dt>
      <dd style={{ marginLeft: 0 }}>{(data.culture ?? []).join(", ") || "—"}</dd>

      <dt style={{ marginTop: 8, fontWeight: 600 }}>Signals</dt>
      <dd style={{ marginLeft: 0 }}>{(data.signals ?? []).join(", ") || "—"}</dd>

      <dt style={{ marginTop: 8, fontWeight: 600 }}>Abuse risk</dt>
      <dd style={{ marginLeft: 0 }}>{data.abuseRisk ?? "—"}</dd>

      <dt style={{ marginTop: 8, fontWeight: 600 }}>Reputation changes</dt>
      <dd style={{ marginLeft: 0 }}>
        {rep.length === 0 ? "—" : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {rep.slice(0, 10).map((r, i) => (
              <li key={i}>{r.employee_id.slice(0, 8)}… δ{r.delta} {r.label ?? ""}</li>
            ))}
            {rep.length > 10 && <li>… +{rep.length - 10} more</li>}
          </ul>
        )}
      </dd>

      <dt style={{ marginTop: 8, fontWeight: 600 }}>Abuse flags</dt>
      <dd style={{ marginLeft: 0 }}>
        {flags.length === 0 ? "—" : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {flags.slice(0, 5).map((f) => (
              <li key={f.id}>{f.signal_type} (severity {f.severity})</li>
            ))}
            {flags.length > 5 && <li>… +{flags.length - 5} more</li>}
          </ul>
        )}
      </dd>

      <dt style={{ marginTop: 8, fontWeight: 600 }}>Risk signals</dt>
      <dd style={{ marginLeft: 0 }}>{(risks.length === 0 ? "—" : risks.slice(0, 5).join(", "))}{risks.length > 5 ? ` … +${risks.length - 5} more` : ""}</dd>

      <dt style={{ marginTop: 8, fontWeight: 600 }}>Trust scores</dt>
      <dd style={{ marginLeft: 0 }}>
        {trust.length === 0 ? "—" : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {trust.slice(0, 5).map((t, i) => (
              <li key={i}>{t.employee_id.slice(0, 8)}… → {t.score.toFixed(2)}</li>
            ))}
            {trust.length > 5 && <li>… +{trust.length - 5} more</li>}
          </ul>
        )}
      </dd>
    </dl>
  );
}
