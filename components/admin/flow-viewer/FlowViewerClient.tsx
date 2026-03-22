"use client";

import { useState } from "react";

type Tab = "onboarding" | "invite" | "employer" | "paywall" | "dashboard";

const TABS: Tab[] = ["onboarding", "invite", "employer", "paywall", "dashboard"];

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <h2 className="mb-2 font-bold">{title}</h2>
      <div className="text-gray-600">{children}</div>
    </div>
  );
}

export function FlowViewerClient() {
  const [tab, setTab] = useState<Tab>("onboarding");

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-bold">WorkVouch Flow Viewer</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded px-4 py-2 text-sm font-medium capitalize ${
              tab === t ? "bg-black text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "onboarding" && (
        <div className="space-y-4">
          <Card title="Step 1">Who have you worked with that would vouch for you?</Card>
          <Card title="Step 2">Add your job (Company + Role)</Card>
          <Card title="Step 3">Add coworkers (2+)</Card>
          <Card title="Step 4">Send invite</Card>
          <Card title="Step 5">Waiting for vouch confirmation</Card>
        </div>
      )}

      {tab === "invite" && (
        <div className="space-y-4">
          <Card title="SMS Message">&quot;Did we work together? Confirm here → [link]&quot;</Card>
          <Card title="Confirmation Page">Did you work with [User]? YES / NO</Card>
          <Card title="Success">You vouched for them 🔥</Card>
        </div>
      )}

      {tab === "employer" && (
        <div className="space-y-4">
          <Card title="Landing">Hire people you can actually trust</Card>
          <Card title="Dashboard">List of verified workers with vouch counts</Card>
        </div>
      )}

      {tab === "paywall" && (
        <div className="space-y-4">
          <Card title="Free Plan">See 3 workers only</Card>
          <Card title="Starter ($49)">See up to 25 workers</Card>
          <Card title="Pro ($149)">Unlimited access</Card>
        </div>
      )}

      {tab === "dashboard" && (
        <div className="space-y-4">
          <Card title="Worker Status">🟡 1 Vouch | 🟢 Verified | 🔥 Trusted</Card>
          <Card title="Locked Users">Upgrade to unlock more workers</Card>
        </div>
      )}
    </div>
  );
}
