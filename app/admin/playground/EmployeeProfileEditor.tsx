"use client";

import type { SimulatedEmployeeProfile, PeerSentiment } from "@/lib/playground/simulatedProfile";
import { defaultSimulatedProfile } from "@/lib/playground/simulatedProfile";
import { ALL_INDUSTRIES, industryLabel, type Industry } from "@/lib/industries";

type Props = {
  profile: SimulatedEmployeeProfile;
  onChange: (profile: SimulatedEmployeeProfile) => void;
};

function field(label: string, id: string, children: React.ReactNode) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function EmployeeProfileEditor({ profile, onChange }: Props) {
  const update = (patch: Partial<SimulatedEmployeeProfile>) => {
    onChange({ ...profile, ...patch });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-5">
      <h2 className="text-sm font-bold text-slate-800">Employee Profile (Editable Controls)</h2>

      <Section title="Industry & role">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field("Industry", "profile-industry", (
            <select
              id="profile-industry"
              value={profile.industry}
              onChange={(e) => update({ industry: e.target.value as Industry })}
              className="border rounded px-2 py-1.5 text-sm w-full"
            >
              {ALL_INDUSTRIES.map((i) => (
                <option key={i} value={i}>{industryLabel(i)}</option>
              ))}
            </select>
          ))}
          {field("Role / job type", "profile-role", (
            <input
              id="profile-role"
              type="text"
              value={profile.role}
              onChange={(e) => update({ role: e.target.value, jobType: e.target.value })}
              className="border rounded px-2 py-1.5 text-sm w-full"
              placeholder="e.g. RN, Manager"
            />
          ))}
        </div>
      </Section>

      <Section title="Experience">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field("Years of experience", "profile-years", (
            <input
              id="profile-years"
              type="number"
              min={0}
              max={50}
              value={profile.yearsExperience}
              onChange={(e) => update({ yearsExperience: Number(e.target.value) || 0 })}
              className="border rounded px-2 py-1.5 text-sm w-full"
            />
          ))}
        </div>
      </Section>

      <Section title="Verifications">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field("Supervisor verifications (count)", "profile-sup-count", (
          <input
            id="profile-sup-count"
            type="number"
            min={0}
            max={20}
            value={profile.supervisorVerificationCount}
            onChange={(e) => update({ supervisorVerificationCount: Number(e.target.value) || 0 })}
            className="border rounded px-2 py-1.5 text-sm w-full"
          />
        ))}
        {field("Supervisor strength (weight)", "profile-sup-weight", (
          <input
            id="profile-sup-weight"
            type="number"
            min={0.5}
            max={2}
            step={0.1}
            value={profile.supervisorWeight}
            onChange={(e) => update({ supervisorWeight: Number(e.target.value) || 1 })}
            className="border rounded px-2 py-1.5 text-sm w-full"
          />
        )}
        </div>
      </Section>

      <Section title="Reviews">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field("Peer reviews (count)", "profile-peer-count", (
          <input
            id="profile-peer-count"
            type="number"
            min={0}
            max={20}
            value={profile.peerReviewCount}
            onChange={(e) => update({ peerReviewCount: Number(e.target.value) || 0 })}
            className="border rounded px-2 py-1.5 text-sm w-full"
          />
        ))}
        {field("Peer recency (days ago)", "profile-peer-recency", (
          <input
            id="profile-peer-recency"
            type="number"
            min={0}
            max={730}
            value={profile.peerRecencyDays}
            onChange={(e) => update({ peerRecencyDays: Number(e.target.value) || 0 })}
            className="border rounded px-2 py-1.5 text-sm w-full"
          />
        ))}
        {field("Peer sentiment", "profile-peer-sentiment", (
          <select
            id="profile-peer-sentiment"
            value={profile.peerSentiment}
            onChange={(e) => update({ peerSentiment: e.target.value as PeerSentiment })}
            className="border rounded px-2 py-1.5 text-sm w-full"
          >
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
        )}
        {field("Coworker reviews (count)", "profile-coworker", (
          <input
            id="profile-coworker"
            type="number"
            min={0}
            max={20}
            value={profile.coworkerReviewCount}
            onChange={(e) => update({ coworkerReviewCount: Number(e.target.value) || 0 })}
            className="border rounded px-2 py-1.5 text-sm w-full"
          />
        )}
        </div>
      </Section>

      <Section title="Employment history">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field("Number of employers", "profile-employers", (
          <input
            id="profile-employers"
            type="number"
            min={0}
            max={50}
            value={profile.employerCount}
            onChange={(e) => update({ employerCount: Number(e.target.value) || 0 })}
            className="border rounded px-2 py-1.5 text-sm w-full"
          />
        ))}
        {field("Average tenure (months)", "profile-tenure", (
          <input
            id="profile-tenure"
            type="number"
            min={0}
            max={600}
            value={profile.averageTenureMonths}
            onChange={(e) => update({ averageTenureMonths: Number(e.target.value) || 0 })}
            className="border rounded px-2 py-1.5 text-sm w-full"
          />
        ))}
        {field("Employment gaps (months)", "profile-gaps", (
          <input
            id="profile-gaps"
            type="number"
            min={0}
            max={120}
            value={profile.employmentGapsMonths}
            onChange={(e) => update({ employmentGapsMonths: Number(e.target.value) || 0 })}
            className="border rounded px-2 py-1.5 text-sm w-full"
          />
        ))}
        </div>
      </Section>

      <Section title="Network strength">
        {field("Network strength (signals)", "profile-network", (
          <input
            id="profile-network"
            type="number"
            min={0}
            max={50}
            value={profile.networkStrength}
            onChange={(e) => update({ networkStrength: Number(e.target.value) || 0 })}
            className="border rounded px-2 py-1.5 text-sm w-full"
          />
        ))}
      </Section>

      <Section title="Certifications">
        {field("Certifications / licenses (industry-aware)", "profile-certs", (
          <input
            id="profile-certs"
            type="number"
            min={0}
            max={20}
            value={profile.certificationsCount}
            onChange={(e) => update({ certificationsCount: Number(e.target.value) || 0 })}
            className="border rounded px-2 py-1.5 text-sm w-full"
          />
        ))}
        <p className="text-xs text-slate-500">Count. Thresholds and weights vary by industry.</p>
      </Section>
      <div className="mt-4 pt-3 border-t border-slate-200">
        <button
          type="button"
          onClick={() => onChange(defaultSimulatedProfile(profile.industry))}
          className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Reset to default (reversible)
        </button>
      </div>
    </div>
  );
}
