"use client";

import { useState, useEffect } from "react";
import {
  saveCandidate,
  unsaveCandidate,
  isCandidateSaved,
} from "@/lib/actions/employer/saved-candidates";
import { sendMessage } from "@/lib/actions/employer/messages";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import {
  BookmarkIcon,
  BookmarkSlashIcon,
  PaperAirplaneIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { WorkHistoryViewer } from "./work-history-viewer";
import { ReferenceViewer } from "./reference-viewer";
import { WorkVouchInsightsSection } from "./workvouch-insights-section";

interface CandidateProfileViewerProps {
  candidateData: any;
}

export function CandidateProfileViewer({
  candidateData,
}: CandidateProfileViewerProps) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageBody, setMessageBody] = useState("");

  useEffect(() => {
    checkSavedStatus();
  }, []);

  const checkSavedStatus = async () => {
    try {
      const status = await isCandidateSaved(candidateData.profile.id);
      setSaved(status);
    } catch (error) {
      console.error("Failed to check saved status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (saved) {
        await unsaveCandidate(candidateData.profile.id);
        setSaved(false);
      } else {
        await saveCandidate(candidateData.profile.id);
        setSaved(true);
      }
    } catch (error: any) {
      alert(error.message || "Failed to update saved status");
    }
  };

  const handleSendMessage = async () => {
    if (!messageBody.trim()) return;

    try {
      await sendMessage(candidateData.profile.id, messageBody);
      setMessageBody("");
      setShowMessageForm(false);
      alert("Message sent!");
    } catch (error: any) {
      alert(error.message || "Failed to send message");
    }
  };

  const { profile, jobs, references, trust_score, industry_fields } =
    candidateData;

  // Normalize profile: convert string | null to string
  const safeProfile = profile
    ? {
        ...profile,
        full_name: profile.full_name ?? "",
        email: profile.email ?? "",
      }
    : null;

  // Normalize jobs: convert string | null to string
  const safeJobs = jobs
    ? jobs.map((job: any) => ({
        ...job,
        company_name: job.company_name ?? "",
        job_title: job.job_title ?? "",
      }))
    : [];

  if (!safeProfile) {
    return <div>Profile not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {safeProfile.profile_photo_url ? (
            <img
              src={safeProfile.profile_photo_url}
              alt={safeProfile.full_name}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-semibold text-2xl">
                {safeProfile.full_name?.charAt(0) || "U"}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">
              {safeProfile.full_name}
            </h1>
            <p className="text-grey-medium dark:text-gray-400">
              {safeProfile.city && safeProfile.state
                ? `${safeProfile.city}, ${safeProfile.state}`
                : "Location not specified"}
            </p>
            {safeProfile.industry && (
              <p className="text-sm text-grey-medium dark:text-gray-400 capitalize">
                {safeProfile.industry.replace("_", " ")}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSave} disabled={loading}>
            {saved ? (
              <>
                <BookmarkSlashIcon className="h-5 w-5 mr-2" />
                Saved
              </>
            ) : (
              <>
                <BookmarkIcon className="h-5 w-5 mr-2" />
                Save Candidate
              </>
            )}
          </Button>
          <Button onClick={() => setShowMessageForm(!showMessageForm)}>
            <PaperAirplaneIcon className="h-5 w-5 mr-2" />
            Message
          </Button>
        </div>
      </div>

      {/* WorkVouch Insights (employer-only, feature-flagged) */}
      <WorkVouchInsightsSection candidateId={safeProfile.id} />

      {/* Trust Score */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-1">
              Trust Score
            </h2>
            <p className="text-sm text-grey-medium dark:text-gray-400">
              Verified credibility score based on references and work history
            </p>
          </div>
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
            {trust_score}
          </div>
        </div>
      </Card>

      {/* Message Form */}
      {showMessageForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
            Send Message
          </h3>
          <textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            rows={4}
            placeholder="Type your message..."
            className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-2 mb-4"
          />
          <div className="flex gap-2">
            <Button onClick={handleSendMessage}>Send Message</Button>
            <Button variant="ghost" onClick={() => setShowMessageForm(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Verified Work History */}
      <WorkHistoryViewer jobs={safeJobs} />

      {/* Peer References */}
      <ReferenceViewer references={references} />

      {/* Industry Fields */}
      {industry_fields && industry_fields.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
            Industry-Specific Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {industry_fields.map((field: any, idx: number) => (
              <div
                key={idx}
                className="p-4 bg-grey-background dark:bg-[#1A1F2B] rounded-xl"
              >
                <p className="text-sm font-semibold text-grey-medium dark:text-gray-400 mb-1">
                  {field.field_name}
                </p>
                <p className="text-grey-dark dark:text-gray-200">
                  {field.field_value || "Not specified"}
                </p>
                {field.verified && (
                  <div className="flex items-center gap-1 mt-2">
                    <CheckBadgeIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                      Verified
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
