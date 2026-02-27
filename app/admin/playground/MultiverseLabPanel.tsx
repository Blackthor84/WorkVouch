"use client";

/**
 * Phases 2–12: GOD_MODE HUD, Reality Actions, Adversarial, Chaos Presets,
 * Counterfactual, Autopsy, Decision Trainer, Lenses, Reality Web, Break the Multiverse.
 */

import { useMultiverseLab } from "@/lib/simulation/multiverse/useMultiverseLab";
import type { PresetName } from "@/lib/simulation/multiverse/chaosPresets";
import type { PerspectiveLens } from "@/lib/simulation/multiverse/types";

type Props = {
  role: string | null;
};

const PRESET_LABELS: Record<PresetName, string> = {
  glassdoor_attack: "Glassdoor Attack",
  zombie_startup: "Zombie Startup",
  perfect_fraud: "Perfect Fraud",
  mass_layoff_shock: "Mass Layoff Shock",
  ai_reference_flood: "AI Reference Flood",
};

const LENS_LABELS: Record<PerspectiveLens, string> = {
  recruiter: "Recruiter",
  enterprise_risk: "Enterprise Risk",
  regulator: "Regulator",
};

export function MultiverseLabPanel({ role }: Props) {
  const lab = useMultiverseLab(role);

  if (!lab.godMode) return null;

  return (
    <div className="space-y-6">
      {/* Phase 2: GOD_MODE HUD */}
      <div className="fixed top-0 left-0 right-0 z-[9998] flex items-center justify-center gap-2 border-b border-amber-500/50 bg-amber-500/15 px-4 py-2 text-amber-900" role="alert">
        <span className="font-semibold">GOD MODE</span>
        <span className="opacity-90">— Safeguards bypassed. All changes local and reversible.</span>
      </div>

      <div className="pt-12" />

      {/* Universe switcher + Fork / Destroy / Reset */}
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Multiverse</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={lab.activeId ?? ""}
            onChange={(e) => lab.setActiveId(e.target.value || null)}
            className="border rounded px-3 py-2 text-sm"
          >
            {lab.universes.map((u) => (
              <option key={u.id} value={u.id}>{u.label}</option>
            ))}
          </select>
          <button type="button" onClick={lab.fork} className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Fork</button>
          <button type="button" onClick={() => lab.activeId && lab.destroy(lab.activeId)} disabled={lab.universes.length <= 1} className="rounded border border-red-200 px-3 py-2 text-sm hover:bg-red-50 disabled:opacity-50">Destroy</button>
          <button type="button" onClick={lab.reset} className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Reset</button>
        </div>
      </section>

      {/* Phase 10: Lenses */}
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Perspective</h2>
        <div className="flex gap-2">
          {(["recruiter", "enterprise_risk", "regulator"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => lab.setLens(l)}
              className={`rounded px-3 py-2 text-sm ${lab.lens === l ? "bg-slate-700 text-white" : "border border-slate-300 hover:bg-slate-50"}`}
            >
              {LENS_LABELS[l]}
            </button>
          ))}
        </div>
      </section>

      {/* Phase 3: Reality actions */}
      <section className="rounded-lg border border-amber-300 bg-amber-50/80 p-4">
        <h2 className="text-lg font-semibold text-amber-900 mb-2">Reality actions</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={lab.doTrustCollapse} className="rounded border border-amber-600 bg-amber-100 px-3 py-2 text-sm text-amber-900 hover:bg-amber-200">Trust collapse</button>
          <button type="button" onClick={() => lab.doFakeConsensus(3)} className="rounded border border-amber-600 bg-amber-100 px-3 py-2 text-sm text-amber-900 hover:bg-amber-200">Fake consensus (3)</button>
          <button type="button" onClick={() => lab.doSupervisorOverride(2.5)} className="rounded border border-amber-600 bg-amber-100 px-3 py-2 text-sm text-amber-900 hover:bg-amber-200">Supervisor override</button>
          <button type="button" onClick={() => lab.doTimeTravel(Math.max(0, (lab.active?.timeline.length ?? 1) - 2))} className="rounded border border-amber-600 bg-amber-100 px-3 py-2 text-sm text-amber-900 hover:bg-amber-200">Rewind</button>
          <button type="button" onClick={() => lab.setDecisionOverride("force_hire")} className="rounded border border-green-600 bg-green-100 px-3 py-2 text-sm text-green-900 hover:bg-green-200">Force hire</button>
          <button type="button" onClick={() => lab.setDecisionOverride("force_reject")} className="rounded border border-red-600 bg-red-100 px-3 py-2 text-sm text-red-900 hover:bg-red-200">Force reject</button>
        </div>
      </section>

      {/* Phase 5: Intent + human error */}
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Intent & human error</h2>
        <p className="text-sm text-slate-600 mb-2">Signals can have intent (helpful | self-serving | malicious | ambiguous) and human error (fatigue, delay, misclick, memory decay). Same signal, different outcome.</p>
        {lab.activeState.signals.length > 0 && (
          <ul className="text-sm text-slate-700 space-y-1">
            {lab.activeState.signals.slice(-5).map((s) => (
              <li key={s.id}>
                {s.source} w={s.weight} {s.intent ? `intent=${s.intent}` : ""} {s.humanError ? `fatigue=${s.humanError.fatigue}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Phase 4: Adversarial */}
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Adversarial mode</h2>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={lab.adversarialMode} onChange={(e) => lab.setAdversarialMode(e.target.checked)} />
          <span>Act as fraudster (inject malicious / self-serving / ambiguous signals)</span>
        </label>
        {lab.adversarialMode && (
          <p className="text-sm text-slate-600 mt-2">Astroturfing, collusion, and silence bias available in Reality actions.</p>
        )}
      </section>

      {/* Phase 6: Trust debt + fragility */}
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Trust debt & fragility</h2>
        <p className="text-sm text-slate-600">Debt: <strong>{lab.trustDebt.toFixed(1)}</strong> — Fragility: <strong>{lab.fragility.toFixed(1)}</strong></p>
        <button type="button" onClick={lab.doDebtCollection} className="mt-2 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 hover:bg-red-100">Trigger debt collection</button>
      </section>

      {/* Phase 7: Chaos presets */}
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Chaos presets</h2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PRESET_LABELS) as PresetName[]).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                const r = lab.runPreset(name);
                if (r) window.dispatchEvent(new CustomEvent("playground-toast", { detail: r.narrative }));
              }}
              className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
            >
              {PRESET_LABELS[name]}
            </button>
          ))}
        </div>
      </section>

      {/* Phase 9: Decision trainer */}
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Decision trainer</h2>
        <p className="text-sm text-slate-600 mb-2">No correct answers — only consequences. Use Rewind above to replay.</p>
        <div className="rounded bg-slate-50 p-3 text-sm text-slate-700">
          Dilemma: Candidate has mixed signals. Force hire or force reject? Current override: {lab.decisionOverride ?? "none"}.
        </div>
      </section>

      {/* Phase 8: Counterfactual + Autopsy */}
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Counterfactual & autopsy</h2>
        {lab.counterfactual && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-slate-700">What had to be true?</h3>
            <p className="text-sm text-slate-600 mt-1">{lab.counterfactual.narrative}</p>
          </div>
        )}
        {lab.autopsy && (
          <div>
            <h3 className="text-sm font-medium text-slate-700">Trust autopsy</h3>
            <p className="text-sm text-slate-600 mt-1">{lab.autopsy.narrative}</p>
          </div>
        )}
      </section>

      {/* Phase 11: Reality Web (lightweight) */}
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Reality web</h2>
        <p className="text-sm text-slate-600 mb-2">Nodes = signals, color = universe</p>
        <div className="flex gap-4 flex-wrap">
          {lab.universes.map((u) => (
            <div key={u.id} className="rounded border p-2" style={{ borderColor: u.id === lab.activeId ? "#2563eb" : "#e2e8f0" }}>
              <span className="font-medium text-sm">{u.label}</span>
              <span className="text-xs text-slate-500 ml-2">{u.trustState.signals.length} signals</span>
            </div>
          ))}
        </div>
        {lab.active && (
          <div className="mt-2">
            <label className="block text-xs font-medium text-slate-700">Timeline scrub</label>
            <input
              type="range"
              min={0}
              max={Math.max(0, lab.active.timeline.length - 1)}
              value={lab.timelineStep}
              onChange={(e) => lab.doTimeTravel(Number(e.target.value))}
              className="w-full mt-1"
            />
          </div>
        )}
      </section>

      {/* Phase 12: Break the multiverse */}
      <section className="rounded-lg border border-red-200 bg-red-50/50 p-4">
        <h2 className="text-lg font-semibold text-red-900 mb-2">Break the multiverse</h2>
        <button
          type="button"
          onClick={() => {
            const r = lab.breakMultiverse();
            if (r) window.dispatchEvent(new CustomEvent("playground-toast", { detail: r.narrative }));
          }}
          className="rounded border-2 border-red-600 bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200"
        >
          BREAK THE MULTIVERSE
        </button>
      </section>
    </div>
  );
}
