"use client";

import { useState, useEffect } from "react";
import {
  getSavedCandidates,
  unsaveCandidate,
} from "@/lib/actions/employer/saved-candidates";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { BookmarkSlashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export function SavedCandidates() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const data = await getSavedCandidates();
      setCandidates(data);
    } catch (error: any) {
      alert(error.message || "Failed to load saved candidates");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (candidateId: string) => {
    try {
      await unsaveCandidate(candidateId);
      await loadCandidates();
    } catch (error: any) {
      alert(error.message || "Failed to unsave candidate");
    }
  };

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <p className="text-grey-medium dark:text-gray-400">
          Loading saved candidates...
        </p>
      </Card>
    );
  }

  if (candidates.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-grey-medium dark:text-gray-400">
          No saved candidates yet. Start searching and save candidates you're
          interested in.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200">
          Saved Candidates ({candidates.length})
        </h2>
      </div>
      {candidates.map((saved) => {
        const candidate = saved.profiles;
        const trustScore = candidate.trust_scores?.[0]?.score || 0;
        return (
          <Card key={saved.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  {candidate.profile_photo_url ? (
                    <img
                      src={candidate.profile_photo_url}
                      alt={candidate.full_name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold text-lg">
                        {candidate.full_name?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-grey-dark dark:text-gray-200">
                      {candidate.full_name}
                    </h3>
                    <p className="text-sm text-grey-medium dark:text-gray-400">
                      {candidate.city && candidate.state
                        ? `${candidate.city}, ${candidate.state}`
                        : "Location not specified"}
                    </p>
                    <p className="text-sm font-semibold text-grey-dark dark:text-gray-200 mt-1">
                      Reputation Score:{" "}
                      <span className="text-blue-600 dark:text-blue-400">
                        {trustScore}
                      </span>
                    </p>
                  </div>
                </div>
                {saved.notes && (
                  <p className="text-sm text-grey-medium dark:text-gray-400 italic mb-3">
                    Notes: {saved.notes}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 ml-4">
                <Button
                  variant="secondary"
                  href={`/employer/candidates/${candidate.id}`}
                >
                  View Profile
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleUnsave(candidate.id)}
                >
                  <BookmarkSlashIcon className="h-5 w-5 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
