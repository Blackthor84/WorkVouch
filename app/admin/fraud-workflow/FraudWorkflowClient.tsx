"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type WorkflowStatus = "clear" | "confirmed" | "escalate";

const CHECKLIST_ITEMS = [
  { id: "reviewedIpLogs", label: "Review IP logs" },
  { id: "checkedEmploymentOverlap", label: "Check employment overlap" },
  { id: "checkedCircularReferences", label: "Check circular references" },
  { id: "reviewedEmployerComplaints", label: "Review employer complaints" },
] as const;

export default function FraudWorkflowClient() {
  const [status, setStatus] = useState<WorkflowStatus | "">("");
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    reviewedIpLogs: false,
    checkedEmploymentOverlap: false,
    checkedCircularReferences: false,
    reviewedEmployerComplaints: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleChecklistChange = (id: string, checked: boolean) => {
    setChecklist((prev) => ({ ...prev, [id]: checked }));
  };

  const handleSubmit = async () => {
    if (!status) {
      setMessage({ type: "error", text: "Select an outcome status." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/fraud-workflow/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          notes: notes.trim() || null,
          checklist: {
            reviewedIpLogs: checklist.reviewedIpLogs,
            checkedEmploymentOverlap: checklist.checkedEmploymentOverlap,
            checkedCircularReferences: checklist.checkedCircularReferences,
            reviewedEmployerComplaints: checklist.reviewedEmployerComplaints,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data?.error ?? "Failed to log." });
        return;
      }
      setMessage({ type: "success", text: "Workflow step logged to audit log." });
      setNotes("");
      setStatus("");
      setChecklist({
        reviewedIpLogs: false,
        checkedEmploymentOverlap: false,
        checkedCircularReferences: false,
        reviewedEmployerComplaints: false,
      });
    } catch {
      setMessage({ type: "error", text: "Request failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">
          Fraud Investigation Workflow
        </h1>
        <p className="mt-2 text-grey-medium dark:text-gray-400">
          Internal process when a fraud flag triggers. All actions are logged to{" "}
          <code className="text-sm bg-slate-100 dark:bg-slate-800 px-1 rounded">audit_logs</code>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">When a fraud flag triggers</CardTitle>
          <p className="text-sm text-grey-medium dark:text-gray-400 font-normal">
            Follow this checklist and record the outcome below.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-3">
              Checklist
            </h3>
            <ul className="space-y-2">
              {CHECKLIST_ITEMS.map(({ id, label }) => (
                <li key={id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={id}
                    checked={checklist[id] ?? false}
                    onChange={(e) => handleChecklistChange(id, e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
                  <label htmlFor={id} className="text-grey-medium dark:text-gray-400">
                    {label}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label htmlFor="status" className="block font-semibold text-grey-dark dark:text-gray-200 mb-2">
              Outcome status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as WorkflowStatus)}
              className="w-full max-w-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-grey-dark dark:text-gray-200"
            >
              <option value="">Select outcome</option>
              <option value="clear">Clear</option>
              <option value="confirmed">Confirmed</option>
              <option value="escalate">Escalate</option>
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block font-semibold text-grey-dark dark:text-gray-200 mb-2">
              Internal notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes for this investigation step..."
              rows={4}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-grey-dark dark:text-gray-200 placeholder:text-slate-400"
            />
          </div>

          {message && (
            <p
              className={
                message.type === "success"
                  ? "text-green-600 dark:text-green-400 text-sm"
                  : "text-red-600 dark:text-red-400 text-sm"
              }
            >
              {message.text}
            </p>
          )}

          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Logging..." : "Log to audit log"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Process summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-grey-medium dark:text-gray-400 space-y-2">
          <p>When a fraud flag triggers:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Review IP logs for suspicious patterns.</li>
            <li>Check employment overlap and coworker matching.</li>
            <li>Check for circular or collusive references.</li>
            <li>Review any employer complaints or reports.</li>
            <li>Decide outcome: clear (false positive), confirmed (flag stands), or escalate.</li>
            <li>Log the step and notes to audit_logs. No user access to this page.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
