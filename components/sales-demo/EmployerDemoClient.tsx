"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BuildingOffice2Icon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { CheckBadgeIcon as CheckBadgeSolid } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoShell } from "@/components/sales-demo/DemoShell";
import { ValueSection } from "@/components/sales-demo/ValueSection";
import { DemoTooltipLabel } from "@/components/sales-demo/DemoTooltip";
import { AnimatedCounter, SkillBar } from "@/components/sales-demo/DemoVisuals";
import {
  DemoBarChart,
  DemoCompareChart,
} from "@/components/sales-demo/DemoCharts";
import {
  DEMO_CANDIDATES,
  DEMO_EMPLOYER,
  EMPLOYER_ANALYTICS,
  EMPLOYER_BENEFITS,
  EMPLOYER_VALUE_BLOCKS,
  type DemoCandidate,
} from "@/lib/demo/sales-demo-data";
import { cn } from "@/lib/utils";

const STEPS = [
  "Employer Signup",
  "Candidate Search",
  "Candidate Profile",
  "Employer Analytics",
  "Employer Benefits",
];

const slide = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

function trustColor(score: number) {
  if (score >= 85) return "text-emerald-600";
  if (score >= 75) return "text-blue-600";
  return "text-amber-600";
}

function CandidateCard({
  candidate,
  selected,
  onSelect,
}: {
  candidate: DemoCandidate;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-xl border p-5 transition-all hover:shadow-md",
        selected
          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
          : "border-gray-200 bg-white hover:border-gray-300",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-gray-900">{candidate.name}</p>
          <p className="text-sm text-gray-500">{candidate.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{candidate.location}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase text-gray-500">
            Trust Score
          </p>
          <p
            className={cn(
              "text-3xl font-bold tabular-nums",
              trustColor(candidate.trustScore),
            )}
          >
            {candidate.trustScore}
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-3 text-xs text-gray-600">
        <span>{candidate.verifiedJobs} verified jobs</span>
        <span>·</span>
        <span>{candidate.verifiedCoworkers} coworkers</span>
      </div>
    </button>
  );
}

function ProfileSection({
  title,
  tooltipKey,
  children,
}: {
  title: string;
  tooltipKey?: "retentionIndicators" | "consistencyMetrics" | "referenceQuality";
  children: React.ReactNode;
}) {
  return (
    <Card>
      <p className="font-semibold text-gray-900 mb-3">
        {tooltipKey ? (
          <DemoTooltipLabel label={title} tooltipKey={tooltipKey} />
        ) : (
          title
        )}
      </p>
      {children}
    </Card>
  );
}

export default function EmployerDemoClient() {
  const [step, setStep] = useState(1);
  const [signupDone, setSignupDone] = useState(false);
  const [selectedId, setSelectedId] = useState("marcus");
  const [searchQuery, setSearchQuery] = useState("Security Supervisor Charlotte");

  const goNext = useCallback(() => setStep((s) => Math.min(s + 1, STEPS.length)), []);
  const goBack = useCallback(() => setStep((s) => Math.max(s - 1, 1)), []);

  const selected =
    DEMO_CANDIDATES.find((c) => c.id === selectedId) ?? DEMO_CANDIDATES[0];

  return (
    <DemoShell
      flow="employer"
      step={step}
      totalSteps={STEPS.length}
      stepLabel={STEPS[step - 1]}
    >
      <AnimatePresence mode="wait">
        {/* Step 1: Signup */}
        {step === 1 && (
          <motion.div key="e1" {...slide} transition={{ duration: 0.35 }}>
            <div className="max-w-2xl mx-auto">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Employer onboarding
              </h1>
              <p className="mt-2 text-gray-600">
                Set up your company to start hiring with verified trust data.
              </p>

              <Card className="mt-8" featured>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100">
                    <BuildingOffice2Icon className="h-7 w-7 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {DEMO_EMPLOYER.company}
                    </p>
                    <p className="text-sm text-indigo-600 font-medium">
                      Hiring for: {DEMO_EMPLOYER.hiringRole}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Company name
                    <input
                      readOnly
                      value={DEMO_EMPLOYER.company}
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm"
                    />
                  </label>
                  <label className="block text-sm font-medium text-gray-700">
                    Primary contact
                    <input
                      readOnly
                      value={`${DEMO_EMPLOYER.contactName} — ${DEMO_EMPLOYER.contactTitle}`}
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm"
                    />
                  </label>
                  <label className="block text-sm font-medium text-gray-700">
                    Role hiring for
                    <input
                      readOnly
                      value={DEMO_EMPLOYER.hiringRole}
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm"
                    />
                  </label>
                </div>

                {!signupDone ? (
                  <Button
                    className="mt-8 w-full"
                    size="lg"
                    onClick={() => setSignupDone(true)}
                  >
                    Create employer account
                  </Button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-8 rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-center"
                  >
                    <CheckBadgeSolid className="mx-auto h-10 w-10 text-emerald-600" />
                    <p className="mt-3 font-semibold text-gray-900">
                      Account ready — start searching candidates
                    </p>
                    <Button className="mt-4" onClick={goNext}>
                      Search candidates <ArrowRightIcon className="ml-1 h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </Card>
            </div>
            <ValueSection blocks={EMPLOYER_VALUE_BLOCKS} />
          </motion.div>
        )}

        {/* Step 2: Search */}
        {step === 2 && (
          <motion.div key="e2" {...slide} transition={{ duration: 0.35 }}>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Candidate Search
            </h1>
            <p className="mt-2 text-gray-600">
              Find candidates ranked by{" "}
              <DemoTooltipLabel label="Trust Score" tooltipKey="trustScore" /> and
              verified peer data.
            </p>

            <div className="mt-6 relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <p className="mt-4 text-sm text-gray-500">
              {DEMO_CANDIDATES.length} candidates match your search
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {DEMO_CANDIDATES.map((c) => (
                <CandidateCard
                  key={c.id}
                  candidate={c}
                  selected={selectedId === c.id}
                  onSelect={() => setSelectedId(c.id)}
                />
              ))}
            </div>

            <Card className="mt-6">
              <p className="text-sm font-semibold text-gray-800 mb-3">
                Quick comparison
              </p>
              <DemoCompareChart
                candidates={DEMO_CANDIDATES.map((c) => ({
                  name: c.name.split(" ")[0],
                  trustScore: c.trustScore,
                }))}
              />
            </Card>

            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={goBack}>
                <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={goNext}>
                View {selected.name.split(" ")[0]}&apos;s profile{" "}
                <ArrowRightIcon className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <ValueSection blocks={EMPLOYER_VALUE_BLOCKS} />
          </motion.div>
        )}

        {/* Step 3: Profile */}
        {step === 3 && (
          <motion.div key="e3" {...slide} transition={{ duration: 0.35 }}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {selected.name}
                </h1>
                <p className="text-gray-600">{selected.title} · {selected.location}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-6 py-4 text-center">
                <DemoTooltipLabel label="Trust Score" tooltipKey="trustScore" />
                <p className="text-4xl font-bold text-emerald-600 tabular-nums mt-1">
                  {selected.trustScore}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {DEMO_CANDIDATES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                    selectedId === c.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="mt-8 grid md:grid-cols-2 gap-5">
              <ProfileSection title="Verified Work History">
                <div className="space-y-3">
                  {selected.workHistory.map((job) => (
                    <div
                      key={job.company}
                      className="flex items-start justify-between rounded-lg bg-gray-50 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{job.company}</p>
                        <p className="text-xs text-gray-500">
                          {job.role} · {job.dates}
                        </p>
                      </div>
                      {job.verified && (
                        <CheckBadgeSolid className="h-5 w-5 text-emerald-500 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </ProfileSection>

              <ProfileSection
                title="Coworker Endorsements"
                tooltipKey="referenceQuality"
              >
                <div className="flex flex-wrap gap-2">
                  {selected.endorsements.map((e) => (
                    <span
                      key={e}
                      className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-1.5 text-sm font-medium text-blue-800"
                    >
                      {e}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  {selected.verifiedCoworkers} verified coworkers ·{" "}
                  {selected.verifiedJobs} verified employers
                </p>
              </ProfileSection>

              <ProfileSection title="Skills Breakdown">
                <div className="space-y-3">
                  {selected.skills.map((s) => (
                    <SkillBar key={s.name} label={s.name} score={s.score} />
                  ))}
                </div>
              </ProfileSection>

              <ProfileSection
                title="Retention Indicators"
                tooltipKey="retentionIndicators"
              >
                <SkillBar
                  label="Retention likelihood"
                  score={selected.retentionScore}
                  color="bg-emerald-600"
                />
                <p className="mt-3 text-xs text-gray-600">
                  Based on tenure patterns and rehire mentions in peer reviews.
                </p>
              </ProfileSection>

              <ProfileSection title="Attendance Reliability">
                <SkillBar
                  label="Attendance score"
                  score={selected.attendanceScore}
                  color="bg-blue-600"
                />
              </ProfileSection>

              <ProfileSection title="Leadership Signals">
                <SkillBar
                  label="Leadership"
                  score={selected.leadershipScore}
                  color="bg-indigo-600"
                />
              </ProfileSection>

              <ProfileSection title="Conflict Resolution Indicators">
                <SkillBar
                  label="De-escalation & conflict handling"
                  score={selected.conflictResolutionScore}
                  color="bg-violet-600"
                />
              </ProfileSection>

              <ProfileSection
                title="Culture Fit Signals"
                tooltipKey="consistencyMetrics"
              >
                <SkillBar
                  label="Culture fit score"
                  score={selected.cultureFitScore}
                  color="bg-teal-600"
                />
              </ProfileSection>
            </div>

            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={goBack}>
                <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={goNext}>
                View analytics dashboard <ArrowRightIcon className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <ValueSection blocks={EMPLOYER_VALUE_BLOCKS} />
          </motion.div>
        )}

        {/* Step 4: Analytics */}
        {step === 4 && (
          <motion.div key="e4" {...slide} transition={{ duration: 0.35 }}>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Employer Analytics
            </h1>
            <p className="mt-2 text-gray-600">
              {DEMO_EMPLOYER.company} — hiring insights at a glance.
            </p>

            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="text-center">
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Avg trust score
                </p>
                <p className="text-3xl font-bold text-blue-600 mt-2 tabular-nums">
                  <AnimatedCounter value={EMPLOYER_ANALYTICS.avgTrustScore} />
                </p>
              </Card>
              <Card className="text-center">
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Applicants this month
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2 tabular-nums">
                  <AnimatedCounter value={EMPLOYER_ANALYTICS.applicantsThisMonth} />
                </p>
              </Card>
              <Card className="text-center">
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Reference response rate
                </p>
                <p className="text-3xl font-bold text-emerald-600 mt-2 tabular-nums">
                  <AnimatedCounter
                    value={EMPLOYER_ANALYTICS.referenceResponseRate}
                    suffix="%"
                  />
                </p>
              </Card>
              <Card className="text-center border-amber-200 bg-amber-50/50">
                <p className="text-xs font-semibold uppercase text-amber-800 flex items-center justify-center gap-1">
                  <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                  Hiring risk alerts
                </p>
                <p className="text-3xl font-bold text-amber-700 mt-2 tabular-nums">
                  {EMPLOYER_ANALYTICS.hiringRiskAlerts}
                </p>
              </Card>
            </div>

            <div className="mt-6 grid lg:grid-cols-2 gap-6">
              <Card>
                <p className="font-semibold text-gray-900 mb-2">
                  Most endorsed skills
                </p>
                <DemoBarChart data={EMPLOYER_ANALYTICS.topSkills} />
              </Card>

              <Card>
                <p className="font-semibold text-gray-900 mb-2">
                  Employee retention indicators
                </p>
                <SkillBar
                  label="Predicted 12-month retention"
                  score={EMPLOYER_ANALYTICS.retentionRate}
                  color="bg-emerald-600"
                />
                <p className="mt-4 text-sm text-gray-600">
                  Candidates with trust scores above 85 show 2.1× higher retention
                  in hospitality security roles.
                </p>

                <p className="font-semibold text-gray-900 mt-6 mb-3 flex items-center gap-1">
                  <UserGroupIcon className="h-4 w-4" />
                  Candidate comparison
                </p>
                <DemoCompareChart
                  candidates={DEMO_CANDIDATES.map((c) => ({
                    name: c.name.split(" ")[0],
                    trustScore: c.trustScore,
                  }))}
                />
              </Card>
            </div>

            <Card className="mt-6 border-red-100 bg-red-50/30">
              <p className="font-semibold text-red-900 text-sm">
                Active hiring risk alerts
              </p>
              <ul className="mt-2 space-y-2 text-sm text-red-800">
                <li>
                  John Brown — trust score 70, low attendance signals, limited peer
                  verification (1 employer)
                </li>
                <li>
                  David Smith — 2 references unverified; leadership score below role
                  threshold
                </li>
                <li>
                  Open requisition &ldquo;Security Supervisor&rdquo; — 14 days avg
                  time-to-fill vs. 9 day target
                </li>
              </ul>
            </Card>

            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={goBack}>
                <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={goNext}>
                See employer benefits <ArrowRightIcon className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <ValueSection blocks={EMPLOYER_VALUE_BLOCKS} />
          </motion.div>
        )}

        {/* Step 5: Benefits */}
        {step === 5 && (
          <motion.div key="e5" {...slide} transition={{ duration: 0.35 }}>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
              Why Employers Choose WorkVouch
            </h1>
            <p className="mt-2 text-gray-600 text-center max-w-xl mx-auto">
              Hire with confidence using verified peer trust — not guesswork.
            </p>

            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {EMPLOYER_BENEFITS.map((benefit, i) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Card hover className="h-full text-center py-5 px-3">
                    <CheckBadgeSolid className="mx-auto h-7 w-7 text-indigo-600" />
                    <p className="mt-3 font-semibold text-gray-900 text-sm leading-snug">
                      {benefit}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
              <Button href="/experience/employee" size="lg" className="gap-2">
                See Employee Experience
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
              <Button href="/experience" variant="outline" size="lg">
                Back to home
              </Button>
            </div>
            <ValueSection blocks={EMPLOYER_VALUE_BLOCKS} />
          </motion.div>
        )}
      </AnimatePresence>
    </DemoShell>
  );
}
