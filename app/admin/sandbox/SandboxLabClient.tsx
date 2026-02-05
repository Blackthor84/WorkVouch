"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AdminSimulationSandbox from "@/components/admin/AdminSimulationSandbox";
import { IntelligenceSandboxClient } from "@/app/admin/intelligence-sandbox/IntelligenceSandboxClient";

type TabId = "simulation" | "intelligence";

const TABS: { id: TabId; label: string }[] = [
  { id: "simulation", label: "Simulation Builder" },
  { id: "intelligence", label: "Intelligence Sandbox" },
];

export function SandboxLabClient({
  employerList,
}: {
  employerList: { id: string; company_name?: string }[];
}) {
  const [tab, setTab] = useState<TabId>("intelligence");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-grey-dark dark:text-gray-200">
          Enterprise Sandbox Lab
        </h1>
        <Link href="/admin">
          <Button variant="secondary">Back to Admin</Button>
        </Link>
      </div>

      <div className="flex gap-2 border-b border-grey-background dark:border-[#374151] pb-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-t font-medium ${
              tab === t.id
                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/50"
                : "text-grey-medium dark:text-gray-400 hover:text-grey-dark dark:hover:text-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "simulation" && <AdminSimulationSandbox />}
      {tab === "intelligence" && <IntelligenceSandboxClient employerList={employerList} />}
    </div>
  );
}
