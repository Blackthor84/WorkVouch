"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { diffRuleConfigs } from "@/lib/sandbox/rules/versioning";

const API = "/api/admin/sandbox-v2";

type RuleVersion = {
  id: string;
  rule_set_name: string;
  version_tag: string;
  config: Record<string, unknown>;
  is_active_sandbox: boolean;
  is_active_production: boolean;
  created_at: string;
};

export function RuleVersionsClient() {
  const [versions, setVersions] = useState<RuleVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [diffA, setDiffA] = useState("");
  const [diffB, setDiffB] = useState("");
  const [diffs, setDiffs] = useState<{ key: string; oldValue: unknown; newValue: unknown }[]>([]);
  const [newRuleSet, setNewRuleSet] = useState("trust_score_formula");
  const [newTag, setNewTag] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    fetch(API + "/rule-versions", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data) setVersions(d.data); else setVersions([]); })
      .finally(() => setLoading(false));
  }, []);

  const runDiff = () => {
    const vA = versions.find((v) => v.id === diffA);
    const vB = versions.find((v) => v.id === diffB);
    if (vA && vB) setDiffs(diffRuleConfigs(vA.config, vB.config));
    else setDiffs([]);
  };

  const createVersion = () => {
    if (!newTag.trim()) return;
    setCreateLoading(true);
    fetch(API + "/rule-versions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ rule_set_name: newRuleSet, version_tag: newTag.trim(), config: {}, set_active_sandbox: false }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setNewTag("");
          fetch(API + "/rule-versions", { credentials: "include" }).then((res) => res.json()).then((x) => x.success && x.data && setVersions(x.data));
        }
      })
      .finally(() => setCreateLoading(false));
  };

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">All versions</h2>
        <ul className="space-y-1 text-sm">
          {versions.map((v) => (
            <li key={v.id} className="flex gap-2 items-center">
              <span className="font-medium">{v.rule_set_name}</span>
              <span className="text-slate-500">{v.version_tag}</span>
              {v.is_active_sandbox && <span className="text-xs bg-amber-100 text-amber-800 px-1 rounded">sandbox</span>}
              {v.is_active_production && <span className="text-xs bg-emerald-100 text-emerald-800 px-1 rounded">prod</span>}
            </li>
          ))}
          {versions.length === 0 && <li className="text-slate-500">No rule versions yet.</li>}
        </ul>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Diff two versions</h2>
        <div className="flex gap-2 items-center flex-wrap mb-2">
          <select value={diffA} onChange={(e) => setDiffA(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
            <option value="">Version A</option>
            {versions.map((v) => <option key={v.id} value={v.id}>{v.rule_set_name} @ {v.version_tag}</option>)}
          </select>
          <select value={diffB} onChange={(e) => setDiffB(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
            <option value="">Version B</option>
            {versions.map((v) => <option key={v.id} value={v.id}>{v.rule_set_name} @ {v.version_tag}</option>)}
          </select>
          <Button type="button" size="sm" onClick={runDiff}>Compare</Button>
        </div>
        {diffs.length > 0 && (
          <>
            <div className="mb-2 text-sm">
              <span className="font-medium text-slate-700">Impact summary:</span> {diffs.length} key(s) changed.
              {diffs.length >= 5 && (
                <span className="ml-2 text-amber-700 font-medium">Warning: large systemic shift — verify score deltas per user before rollout.</span>
              )}
            </div>
            <ul className="text-sm space-y-1">
              {diffs.map((d) => (
                <li key={d.key} className="flex gap-2">
                  <span className="font-mono">{d.key}</span>
                  <span className="text-slate-500">{JSON.stringify(d.oldValue)} to {JSON.stringify(d.newValue)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-slate-500">Score deltas per user and % affected require running both versions on the same sandbox population (extend diff engine as needed).</p>
          </>
        )}
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Create version</h2>
        <div className="flex gap-2 items-center flex-wrap">
          <select value={newRuleSet} onChange={(e) => setNewRuleSet(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
            <option value="trust_score_formula">trust_score_formula</option>
            <option value="overlap_verification">overlap_verification</option>
            <option value="review_weighting">review_weighting</option>
            <option value="penalty_thresholds">penalty_thresholds</option>
            <option value="fraud_detection_thresholds">fraud_detection_thresholds</option>
          </select>
          <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Version tag" className="rounded border px-2 py-1.5 text-sm w-40" />
          <Button type="button" size="sm" onClick={createVersion} disabled={createLoading || !newTag.trim()}>Create</Button>
        </div>
      </div>
    </div>
  );
}
