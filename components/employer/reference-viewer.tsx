"use client";

import { Card } from "../ui/card";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { StarIcon } from "@heroicons/react/24/outline";

interface ReferenceWithBadges {
  id: string;
  rating: number;
  written_feedback?: string | null;
  comment?: string | null;
  created_at: string;
  is_direct_manager?: boolean;
  is_repeated_coworker?: boolean;
  is_verified_match?: boolean;
  from_user?: { full_name?: string; profile_photo_url?: string } | null;
  profiles?: { full_name?: string; profile_photo_url?: string } | null;
}

interface ReferenceViewerProps {
  references: ReferenceWithBadges[];
}

export function ReferenceViewer({ references }: ReferenceViewerProps) {
  if (references.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Peer References
        </h2>
        <p className="text-grey-medium dark:text-gray-400">
          No references available.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
        Peer References ({references.length})
      </h2>
      <div className="space-y-4">
        {references.map((ref) => {
          const coworker = ref.from_user || ref.profiles;
          return (
            <div
              key={ref.id}
              className="p-4 border border-grey-background dark:border-[#374151] rounded-xl"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {coworker?.profile_photo_url ? (
                    <img
                      src={coworker.profile_photo_url}
                      alt={coworker.full_name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        {coworker?.full_name?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-grey-dark dark:text-gray-200">
                      {coworker?.full_name || "Anonymous"}
                    </h3>
                    <p className="text-sm text-grey-medium dark:text-gray-400">
                      Former Coworker
                    </p>
                    {(ref.is_direct_manager || ref.is_repeated_coworker || ref.is_verified_match) && (
                      <div
                        className="flex flex-wrap gap-1.5 mt-1.5"
                        title="This reference is supported by verified employment data."
                      >
                        {ref.is_direct_manager && (
                          <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                            🏷 Direct Manager
                          </span>
                        )}
                        {ref.is_repeated_coworker && (
                          <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                            🏷 Repeated Coworker
                          </span>
                        )}
                        {ref.is_verified_match && (
                          <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                            🏷 Verified Match
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIconSolid
                      key={i}
                      className={`h-5 w-5 ${
                        i < ref.rating
                          ? "text-yellow-400"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  ))}
                </div>
              </div>
              {(ref.written_feedback || ref.comment) && (
                <p className="text-grey-dark dark:text-gray-200 italic">
                  "{ref.written_feedback || ref.comment}"
                </p>
              )}
              <p className="text-xs text-grey-medium dark:text-gray-400 mt-2">
                {new Date(ref.created_at).toLocaleDateString()}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
