"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import {
  RehireRecommendation,
  RehireReasonCategory,
} from "@/lib/compliance-types";
import {
  REHIRE_SUBMISSION_FOOTER,
  DISPUTE_AVAILABILITY,
} from "@/lib/verification-copy";

const DETAILED_EXPLANATION_MIN_LENGTH = 150;

const RECOMMENDATION_LABELS: Record<RehireRecommendation, string> = {
  [RehireRecommendation.Approved]: "Approved",
  [RehireRecommendation.EligibleWithReview]: "Eligible with review",
  [RehireRecommendation.NotEligible]: "Not eligible",
};

const REASON_LABELS: Record<RehireReasonCategory, string> = {
  [RehireReasonCategory.AttendanceIssues]: "Attendance issues",
  [RehireReasonCategory.PolicyViolation]: "Policy violation",
  [RehireReasonCategory.PerformanceConcerns]: "Performance concerns",
  [RehireReasonCategory.ContractCompletion]: "Contract completion",
  [RehireReasonCategory.RoleEliminated]: "Role eliminated",
  [RehireReasonCategory.Other]: "Other",
};

export interface RehireEntry {
  id: string;
  profile_id: string;
  full_name: string;
  rehire_eligible: boolean;
  rehire_status?: string | null;
  reason?: string | null;
  detailed_explanation?: string | null;
  confirmed_accuracy?: boolean;
  submitted_at?: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface RehireRegistrySectionProps {
  entries: RehireEntry[];
  onRefresh: () => void;
}

function recommendationFromEntry(e: RehireEntry): RehireRecommendation {
  if (e.rehire_status === RehireRecommendation.EligibleWithReview)
    return RehireRecommendation.EligibleWithReview;
  if (e.rehire_status === RehireRecommendation.NotEligible)
    return RehireRecommendation.NotEligible;
  return RehireRecommendation.Approved;
}

export function RehireRegistrySection({ entries, onRefresh }: RehireRegistrySectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<RehireRecommendation>(
    RehireRecommendation.Approved
  );
  const [reasonCategory, setReasonCategory] = useState<RehireReasonCategory | "">("");
  const [detailedExplanation, setDetailedExplanation] = useState("");
  const [confirmedAccuracy, setConfirmedAccuracy] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [modalConfirmed, setModalConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const entry = editingId ? entries.find((e) => e.id === editingId) : null;
  const needsReason =
    recommendation === RehireRecommendation.EligibleWithReview ||
    recommendation === RehireRecommendation.NotEligible;
  const explanationLength = detailedExplanation.trim().length;
  const explanationValid = !needsReason || explanationLength >= DETAILED_EXPLANATION_MIN_LENGTH;
  const canSubmit =
    (recommendation === RehireRecommendation.Approved && confirmedAccuracy) ||
    (needsReason &&
      reasonCategory !== "" &&
      explanationValid &&
      confirmedAccuracy);

  const openEdit = (e: RehireEntry) => {
    setEditingId(e.id);
    setRecommendation(recommendationFromEntry(e));
    setReasonCategory((e.reason as RehireReasonCategory) ?? "");
    setDetailedExplanation(e.detailed_explanation ?? e.internal_notes ?? "");
    setConfirmedAccuracy(e.confirmed_accuracy ?? false);
    setInternalNotes(e.internal_notes ?? "");
    setShowSubmitModal(false);
    setModalConfirmed(false);
    setValidationError(null);
  };

  const closeEdit = () => {
    setEditingId(null);
    setRecommendation(RehireRecommendation.Approved);
    setReasonCategory("");
    setDetailedExplanation("");
    setConfirmedAccuracy(false);
    setInternalNotes("");
    setShowSubmitModal(false);
    setModalConfirmed(false);
    setValidationError(null);
  };

  const requestSubmit = () => {
    setValidationError(null);
    if (!canSubmit) {
      if (!confirmedAccuracy)
        setValidationError("Please confirm that this recommendation is accurate and supported by internal documentation.");
      else if (needsReason && !reasonCategory)
        setValidationError("Please select a reason category.");
      else if (needsReason && !explanationValid)
        setValidationError(
          `Detailed explanation must be at least ${DETAILED_EXPLANATION_MIN_LENGTH} characters (${explanationLength} entered).`
        );
      return;
    }
    setShowSubmitModal(true);
  };

  const submitWithModalConfirmation = async () => {
    if (!modalConfirmed || !entry) return;
    await doSave();
  };

  const doSave = async () => {
    if (!entry) return;
    setSaving(true);
    setValidationError(null);
    try {
      const body: Record<string, unknown> = {
        profileId: entry.profile_id,
        recommendation,
        confirmedAccuracy: true,
        internalNotes: internalNotes.trim() || undefined,
      };
      if (needsReason) {
        body.reasonCategory = reasonCategory;
        body.detailedExplanation = detailedExplanation.trim();
      }
      const res = await fetch("/api/employer/rehire", {
        method: entry.submitted_at ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        closeEdit();
        onRefresh();
      } else {
        setValidationError(
          typeof data?.error === "string"
            ? data.error
            : Array.isArray(data?.error)
              ? Object.values(data.error).flat().join(" ")
              : "Save failed. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const formatSubmittedAt = (iso: string | null | undefined): string => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
        Rehire Registry
      </h2>
      {entries.length === 0 ? (
        <p className="text-sm text-grey-medium dark:text-gray-400">No rehire entries yet.</p>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <div
              key={e.id}
              className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-grey-background dark:bg-[#1A1F2B]"
            >
              <span className="font-medium text-grey-dark dark:text-gray-200">{e.full_name}</span>
              <Badge variant={e.rehire_eligible ? "success" : "secondary"}>
                {e.rehire_eligible ? "Rehire Eligible" : "Not Eligible"}
              </Badge>
              {e.rehire_status && (
                <span className="text-sm text-grey-medium dark:text-gray-400">
                  {RECOMMENDATION_LABELS[e.rehire_status as RehireRecommendation] ?? e.rehire_status}
                </span>
              )}
              {e.submitted_at && (
                <span className="text-xs text-grey-medium dark:text-gray-500">
                  Submitted {formatSubmittedAt(e.submitted_at)}
                </span>
              )}
              {e.internal_notes && (
                <span className="text-sm text-grey-medium dark:text-gray-400 truncate max-w-xs">
                  {e.internal_notes}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEdit(e)}
                className="ml-auto"
                aria-label="Edit rehire"
              >
                <PencilSquareIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-sm text-grey-medium dark:text-gray-500">
        {REHIRE_SUBMISSION_FOOTER} {DISPUTE_AVAILABILITY}
      </p>

      {entry && !showSubmitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rehire-edit-title"
        >
          <div className="bg-white dark:bg-[#1A1F2B] rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl border border-grey-background dark:border-[#374151] max-h-[90vh] overflow-y-auto">
            <h3
              id="rehire-edit-title"
              className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4"
            >
              Rehire recommendation — {entry.full_name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">
                  Recommendation
                </label>
                <select
                  value={recommendation}
                  onChange={(ev) =>
                    setRecommendation(ev.target.value as RehireRecommendation)
                  }
                  className="w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#0D1117] px-3 py-2 text-sm text-grey-dark dark:text-gray-200"
                >
                  {(Object.keys(RECOMMENDATION_LABELS) as RehireRecommendation[]).map((r) => (
                    <option key={r} value={r}>
                      {RECOMMENDATION_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>

              {needsReason && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">
                      Reason category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={reasonCategory}
                      onChange={(ev) =>
                        setReasonCategory(ev.target.value as RehireReasonCategory)
                      }
                      className="w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#0D1117] px-3 py-2 text-sm text-grey-dark dark:text-gray-200"
                    >
                      <option value="">Select reason</option>
                      {(Object.keys(REASON_LABELS) as RehireReasonCategory[]).map((r) => (
                        <option key={r} value={r}>
                          {REASON_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">
                      Detailed explanation <span className="text-red-500">*</span> (min{" "}
                      {DETAILED_EXPLANATION_MIN_LENGTH} characters)
                    </label>
                    <textarea
                      value={detailedExplanation}
                      onChange={(ev) => setDetailedExplanation(ev.target.value)}
                      rows={5}
                      className="w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#0D1117] px-3 py-2 text-sm text-grey-dark dark:text-gray-200"
                      placeholder="Provide a clear, factual explanation supported by internal documentation."
                    />
                    {needsReason && (
                      <p
                        className={
                          explanationValid
                            ? "text-xs text-grey-medium dark:text-gray-500 mt-1"
                            : "text-xs text-amber-600 dark:text-amber-400 mt-1"
                        }
                      >
                        {explanationLength} / {DETAILED_EXPLANATION_MIN_LENGTH} characters
                      </p>
                    )}
                  </div>
                </>
              )}

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmedAccuracy}
                  onChange={(ev) => setConfirmedAccuracy(ev.target.checked)}
                  className="rounded border-grey-medium mt-1"
                />
                <span className="text-sm text-grey-dark dark:text-gray-200">
                  I confirm this recommendation is accurate and supported by internal documentation.
                </span>
              </label>

              <div>
                <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-1">
                  Internal notes (optional)
                </label>
                <textarea
                  value={internalNotes}
                  onChange={(ev) => setInternalNotes(ev.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#0D1117] px-3 py-2 text-sm text-grey-dark dark:text-gray-200"
                  placeholder="Optional internal notes"
                />
              </div>

              {validationError && (
                <p className="text-sm text-amber-600 dark:text-amber-400">{validationError}</p>
              )}
            </div>
            <div className="flex gap-2 mt-6 justify-end">
              <Button variant="secondary" onClick={closeEdit} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={requestSubmit} disabled={saving}>
                {saving ? "Saving…" : "Submit recommendation"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {entry && showSubmitModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rehire-confirm-title"
        >
          <div className="bg-white dark:bg-[#1A1F2B] rounded-xl p-6 max-w-md w-full mx-4 shadow-xl border border-grey-background dark:border-[#374151]">
            <h3
              id="rehire-confirm-title"
              className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-3"
            >
              Confirm submission
            </h3>
            <p className="text-sm text-grey-medium dark:text-gray-400 mb-4">
              This rehire recommendation may influence future hiring decisions. Please confirm the
              information provided is accurate and responsibly submitted.
            </p>
            <label className="flex items-start gap-2 cursor-pointer mb-6">
              <input
                type="checkbox"
                checked={modalConfirmed}
                onChange={(ev) => setModalConfirmed(ev.target.checked)}
                className="rounded border-grey-medium mt-1"
              />
              <span className="text-sm text-grey-dark dark:text-gray-200">
                I confirm the information is accurate and responsibly submitted.
              </span>
            </label>
            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowSubmitModal(false);
                  setModalConfirmed(false);
                }}
                disabled={saving}
              >
                Back
              </Button>
              <Button
                onClick={submitWithModalConfirmation}
                disabled={!modalConfirmed || saving}
              >
                {saving ? "Saving…" : "Confirm and submit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
