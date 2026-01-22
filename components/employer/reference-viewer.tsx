"use client";

import { Card } from "../ui/card";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { StarIcon } from "@heroicons/react/24/outline";

interface ReferenceViewerProps {
  references: any[];
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
