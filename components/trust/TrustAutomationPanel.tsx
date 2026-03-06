"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { BoltIcon } from "@heroicons/react/24/outline";
import { TrustAutomationBuilder } from "./TrustAutomationBuilder";
import { TrustAutomationRuleCard } from "./TrustAutomationRuleCard";
import type { TrustAutomationRule } from "./TrustAutomationRuleCard";
import { TrustAlertFeed } from "./TrustAlertFeed";

export interface TrustAutomationPanelProps {
  /** When true, show compact view (e.g. for candidate profile). */
  compact?: boolean;
}

export function TrustAutomationPanel({ compact = false }: TrustAutomationPanelProps) {
  const [rules, setRules] = useState<TrustAutomationRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = () => {
    setLoading(true);
    fetch("/api/employer/automation/rules", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { rules: [] }))
      .then((d: { rules?: TrustAutomationRule[] }) => {
        setRules(Array.isArray(d.rules) ? d.rules : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRules();
  }, []);

  if (compact) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
          <BoltIcon className="h-5 w-5" />
          Automation
        </h3>
        {loading ? (
          <div className="h-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        ) : rules.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No automation rules.</p>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {rules.length} active rule{rules.length !== 1 ? "s" : ""}. Alerts run when trust events occur for saved candidates or employees.
          </p>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
          <BoltIcon className="h-5 w-5" />
          Trust Automation
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Rules run when trust events occur (reference added, verification, dispute, credential shared). Only saved candidates and your employees are evaluated.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <TrustAutomationBuilder onCreated={fetchRules} />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Active rules</h3>
            {loading ? (
              <div className="h-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            ) : rules.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No rules yet.</p>
            ) : (
              <div className="space-y-2">
                {rules.map((r) => (
                  <TrustAutomationRuleCard key={r.id} rule={r} />
                ))}
              </div>
            )}
          </div>
          <TrustAlertFeed limit={15} />
        </div>
      </div>
    </div>
  );
}
