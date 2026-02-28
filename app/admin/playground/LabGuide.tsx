"use client";

/**
 * Built-in Lab Guide: how to use controls, what affects trust vs confidence,
 * industry considerations, and example scenarios. Part of the Lab Dashboard.
 */
export function LabGuide() {
  return (
    <details className="rounded-xl border border-slate-200 bg-white overflow-hidden" open={false}>
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border-b border-slate-200">
        Lab Guide / Cheat Sheet
      </summary>
      <div className="p-4 space-y-4 text-sm text-slate-700">
        <section>
          <h3 className="font-semibold text-slate-900 mb-1">How to use the Lab</h3>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            <li>Edit the <strong>Employee Builder</strong> (left): industry, role, experience, verifications, reviews, employment history, network, certifications.</li>
            <li>Every change re-runs the trust, confidence, fragility, and compliance engines immediately.</li>
            <li>The <strong>Outcome Panel</strong> (right) stays visible and updates live.</li>
            <li>Use <strong>Advanced Tools</strong> (Compare, Stress Test, ROI, Decision Trainer) for scenarios—they operate on your current simulated profile.</li>
            <li>All data is <strong>SIMULATED</strong>; no real employee records are modified.</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-slate-900 mb-1">What affects Trust vs Confidence</h3>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            <li><strong>Trust:</strong> Supervisor verifications (count and strength), peer/coworker reviews, certifications, network strength. More recent, positive signals raise trust.</li>
            <li><strong>Confidence:</strong> Volume and recency of signals. More reviews and newer data increase confidence in the score.</li>
            <li><strong>Fragility:</strong> Gaps, low tenure, few verifications, or negative peer sentiment can increase fragility.</li>
            <li><strong>Trust debt:</strong> Builds when decisions or overrides conflict with the model; stress tests and force-hire scenarios can increase it.</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-slate-900 mb-1">Industry-specific considerations</h3>
          <p className="text-xs mb-1">
            Each industry has a <strong>hiring threshold</strong>. Your simulated employee passes compliance when Trust Score ≥ that threshold.
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            <li><strong>Healthcare, Law enforcement, Security:</strong> Higher thresholds (e.g. 80–90). Add more verifications and positive reviews to pass.</li>
            <li><strong>Retail, Warehouse logistics:</strong> Lower thresholds (e.g. 50–55). Fewer signals may still pass.</li>
            <li><strong>Education, Hospitality, Skilled trades, Construction:</strong> Mid-range thresholds. Balance experience and reviews.</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-slate-900 mb-1">What advanced tools do</h3>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            <li><strong>Compare:</strong> Side-by-side scenario or multiverse comparison; load saved scenarios and compare to current.</li>
            <li><strong>Stress Test:</strong> Chaos presets and God Mode–style actions to see how outcomes change under distortion.</li>
            <li><strong>ROI:</strong> Estimated financial exposure and optional counterfactual (with vs without WorkVouch); industry-based assumptions.</li>
            <li><strong>Decision Trainer:</strong> Force hire or reject and see impact on trust, debt, and compliance (multiverse/god mode).</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-slate-900 mb-1">Example scenarios to try</h3>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            <li><strong>“Ideal hire”:</strong> Healthcare, 5+ years, 2+ supervisor verifications, positive peer sentiment, 1+ certifications → aim for Trust ≥ 85.</li>
            <li><strong>“Risky profile”:</strong> Few verifications, employment gaps, negative peer sentiment → watch fragility and trust debt rise.</li>
            <li><strong>“Compare industries”:</strong> Keep the same profile and switch Industry—see how the threshold and compliance status change.</li>
            <li><strong>“Stress test”:</strong> Open Advanced Tools → Stress Test to run chaos presets and see how outcomes shift.</li>
          </ul>
        </section>
      </div>
    </details>
  );
}
