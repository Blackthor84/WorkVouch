"use client";

import { Card } from "./ui/card";
import { Button } from "./ui/button";

interface Report {
  profile: any;
  jobs: any[];
  references: any[];
  trustScore: any;
}

export function CandidateReportView({ report }: { report: Report }) {
  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const data = {
      profile: report.profile,
      jobs: report.jobs,
      references: report.references,
      trustScore: report.trustScore,
      generatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workvouch-report-${report.profile.id}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">
            Candidate Report
          </h1>
          <p className="mt-1 text-sm text-grey-medium dark:text-gray-400">
            Verified professional profile and references
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleExport}>
            Export JSON
          </Button>
          <Button variant="secondary" onClick={handlePrint}>
            Print Report
          </Button>
        </div>
      </div>

      {/* Profile Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-grey-dark dark:text-gray-200 mb-4">
          Profile Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-semibold text-grey-medium dark:text-gray-400">
              Full Name
            </p>
            <p className="text-lg text-grey-dark dark:text-gray-200">
              {report.profile.full_name}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-grey-medium dark:text-gray-400">
              Email
            </p>
            <p className="text-lg text-grey-dark dark:text-gray-200">
              {report.profile.email}
            </p>
          </div>
          {(report.profile.city || report.profile.state) && (
            <div>
              <p className="text-sm font-semibold text-grey-medium dark:text-gray-400">
                Location
              </p>
              <p className="text-lg text-grey-dark dark:text-gray-200">
                {[report.profile.city, report.profile.state]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          )}
          {report.profile.professional_summary && (
            <div className="md:col-span-2">
              <p className="text-sm font-semibold text-grey-medium dark:text-gray-400 mb-2">
                Summary
              </p>
              <p className="text-grey-dark dark:text-gray-200">
                {report.profile.professional_summary}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Reputation Score */}
      {report.trustScore && (
        <Card className="p-6 print:break-inside-avoid">
          <h2 className="text-2xl font-bold text-grey-dark dark:text-gray-200 mb-4">
            Reputation Score
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold text-primary">
              {report.trustScore.score || 0}
            </div>
            <div className="flex-1">
              <div className="w-full bg-grey-background dark:bg-[#374151] rounded-full h-4 mb-2">
                <div
                  className="bg-primary h-4 rounded-full transition-all"
                  style={{
                    width: `${Math.min((report.trustScore.score || 0) / 10, 100)}%`,
                  }}
                />
              </div>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                Based on verified jobs, peer references, and verification
                completeness
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Work History */}
      <Card className="p-6 print:break-inside-avoid">
        <h2 className="text-2xl font-bold text-grey-dark dark:text-gray-200 mb-4">
          Work History ({report.jobs.length})
        </h2>
        <div className="space-y-4">
          {report.jobs.map((job) => (
            <div
              key={job.id}
              className="border-l-4 border-blue-600 dark:border-blue-400 pl-4 py-2"
            >
              <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200">
                {job.job_title}
              </h3>
              <p className="text-grey-medium dark:text-gray-400 font-medium">
                {job.company_name}
              </p>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                {new Date(job.start_date).toLocaleDateString()} -{" "}
                {job.end_date
                  ? new Date(job.end_date).toLocaleDateString()
                  : "Present"}
                {job.location && ` • ${job.location}`}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* References */}
      <Card className="p-6 print:break-inside-avoid">
        <h2 className="text-2xl font-bold text-grey-dark dark:text-gray-200 mb-4">
          Peer References ({report.references.length})
        </h2>
        <div className="space-y-4">
          {report.references.map((ref) => (
            <div
              key={ref.id}
              className="border border-grey-background dark:border-[#374151] rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-grey-dark dark:text-gray-200">
                    {ref.from_user?.full_name || "Anonymous"}
                  </p>
                  <p className="text-sm text-grey-medium dark:text-gray-400">
                    {ref.job?.company_name} • {ref.relationship_type}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-lg ${
                        i < ref.rating
                          ? "text-yellow-400"
                          : "text-grey-light dark:text-gray-600"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              {ref.written_feedback && (
                <p className="text-grey-dark dark:text-gray-200 mt-2">
                  {ref.written_feedback}
                </p>
              )}
              <p className="text-xs text-grey-light dark:text-gray-500 mt-2">
                {new Date(ref.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-grey-medium dark:text-gray-400 print:break-inside-avoid">
        <p>Report generated by WorkVouch on {new Date().toLocaleString()}</p>
        <p className="mt-1">
          This report contains verified information from peer references.
        </p>
      </div>
    </div>
  );
}
