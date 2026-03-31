"use client";

import { useMemo, useState } from "react";
import SavedHiringCalculations from "@/components/lab/SavedHiringCalculations";
import { useSupabaseSession } from "@/lib/hooks/useSupabaseSession";

function clampTrust(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

/** Adjusted bad-hire risk dollars for a given baseline total and trust score 0–100. */
function adjustedRisk(total: number, trustScore: number): number {
  const t = clampTrust(trustScore);
  return Math.round(total * (1 - t / 100));
}

export default function HiringImpactCalculator() {
  const { data: { user }, status: authStatus } = useSupabaseSession();
  const [salary, setSalary] = useState(70000);
  const [trainingWeeks, setTrainingWeeks] = useState(6);
  const [replacementWeeks, setReplacementWeeks] = useState(4);

  const [trustA, setTrustA] = useState(45);
  const [trustB, setTrustB] = useState(78);

  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [savedRefresh, setSavedRefresh] = useState(0);

  const trainingCost = salary * (trainingWeeks / 52);
  const lostProductivity = salary * (replacementWeeks / 52);
  const rehiringCost = salary * 0.25;
  const total = Math.round(trainingCost + lostProductivity + rehiringCost);

  const riskA = adjustedRisk(total, trustA);
  const riskB = adjustedRisk(total, trustB);

  const { higherTrustLabel, lowerTrustLabel, riskSavings } = useMemo(() => {
    const ta = clampTrust(trustA);
    const tb = clampTrust(trustB);
    if (ta === tb) {
      return {
        higherTrustLabel: "same trust level" as const,
        lowerTrustLabel: null,
        riskSavings: 0,
      };
    }
    const highIsA = ta > tb;
    const highRisk = highIsA ? riskB : riskA;
    const lowRisk = highIsA ? riskA : riskB;
    return {
      higherTrustLabel: highIsA ? "Candidate A" : "Candidate B",
      lowerTrustLabel: highIsA ? "Candidate B" : "Candidate A",
      riskSavings: highRisk - lowRisk,
    };
  }, [trustA, trustB, riskA, riskB]);

  async function handleSave() {
    setSaveMessage(null);
    if (!user?.id) {
      setSaveMessage("Sign in to save this calculation.");
      return;
    }
    setSaveBusy(true);
    try {
      const res = await fetch("/api/hiring-calculations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salary,
          training_weeks: trainingWeeks,
          replacement_weeks: replacementWeeks,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveMessage(
          typeof data.error === "string" ? data.error : "Save failed"
        );
        return;
      }
      setSaveMessage("Saved.");
      setSavedRefresh((n) => n + 1);
    } catch {
      setSaveMessage("Save failed");
    } finally {
      setSaveBusy(false);
    }
  }

  return (
    <div className="space-y-8 max-w-3xl w-full">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-2">Hiring Impact Calculator</h2>
        <p className="text-sm text-gray-600 mb-6">
          Estimate baseline bad-hire cost, then see how verified coworker trust
          scores change the adjusted risk—so you can justify choosing
          better-vouched candidates.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Annual salary
            <input
              type="number"
              value={salary}
              onChange={(e) => setSalary(Number(e.target.value))}
              className="p-3 border rounded-lg font-normal"
              min={0}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Training weeks
            <input
              type="number"
              value={trainingWeeks}
              onChange={(e) => setTrainingWeeks(Number(e.target.value))}
              className="p-3 border rounded-lg font-normal"
              min={0}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Replacement weeks
            <input
              type="number"
              value={replacementWeeks}
              onChange={(e) => setReplacementWeeks(Number(e.target.value))}
              className="p-3 border rounded-lg font-normal"
              min={0}
            />
          </label>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 text-center mb-6">
          <p className="text-gray-500 text-sm">Baseline cost of a bad hire</p>
          <div className="text-4xl font-bold text-red-500 my-3">
            ${total.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Training: ${Math.round(trainingCost).toLocaleString()}</p>
            <p>
              Lost productivity: $
              {Math.round(lostProductivity).toLocaleString()}
            </p>
            <p>Rehiring: ${Math.round(rehiringCost).toLocaleString()}</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 p-5 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Compare candidates (trust scores)
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Adjusted risk uses: baseline × (1 − trust / 100). Higher verified
            trust lowers expected downside in this simplified model.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Candidate A — trust score (0–100)
              <input
                type="number"
                value={trustA}
                onChange={(e) => setTrustA(Number(e.target.value))}
                className="p-3 border rounded-lg font-normal"
                min={0}
                max={100}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Candidate B — trust score (0–100)
              <input
                type="number"
                value={trustB}
                onChange={(e) => setTrustB(Number(e.target.value))}
                className="p-3 border rounded-lg font-normal"
                min={0}
                max={100}
              />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
              <p className="text-gray-600">A — adjusted risk</p>
              <p className="text-xl font-bold text-amber-900">
                ${riskA.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
              <p className="text-gray-600">B — adjusted risk</p>
              <p className="text-xl font-bold text-amber-900">
                ${riskB.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 mb-6">
          <h3 className="text-lg font-semibold text-emerald-950 mb-2">
            Trust score impact
          </h3>
          {riskSavings === 0 ? (
            <p className="text-sm text-emerald-900">
              Enter two different trust scores to see how much adjusted risk
              improves when you favor the more verified worker.
            </p>
          ) : (
            <p className="text-sm text-emerald-900 leading-relaxed">
              <span className="font-semibold">{higherTrustLabel}</span> carries{" "}
              <span className="font-bold">
                ${riskSavings.toLocaleString()} less
              </span>{" "}
              adjusted risk than{" "}
              <span className="font-semibold">{lowerTrustLabel}</span> for this
              same hiring scenario—highlighting the value of verified coworker
              vouches on WorkVouch.
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saveBusy || authStatus === "loading"}
            className="bg-black text-white px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveBusy ? "Saving…" : "Save calculation"}
          </button>
          {saveMessage && (
            <span className="text-sm text-gray-600">{saveMessage}</span>
          )}
        </div>

        <button
          type="button"
          className="mt-4 w-full border border-gray-300 bg-white text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-50"
        >
          Reduce this risk with WorkVouch
        </button>
      </div>

      <SavedHiringCalculations refreshToken={savedRefresh} />
    </div>
  );
}
