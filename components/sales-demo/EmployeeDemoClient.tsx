"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { CheckBadgeIcon as CheckBadgeSolid } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoShell } from "@/components/sales-demo/DemoShell";
import { ValueSection } from "@/components/sales-demo/ValueSection";
import { DemoTooltipLabel } from "@/components/sales-demo/DemoTooltip";
import {
  AnimatedCounter,
  SkillBar,
  StarRating,
} from "@/components/sales-demo/DemoVisuals";
import { DemoRadarChart } from "@/components/sales-demo/DemoCharts";
import {
  COWORKER_MATCHES,
  DEMO_EMPLOYEE,
  EMPLOYEE_BENEFITS,
  EMPLOYEE_VALUE_BLOCKS,
  INCOMING_REVIEWS,
  REVIEW_TARGETS,
  type DemoReview,
} from "@/lib/demo/sales-demo-data";

const STEPS = [
  "Employee Signup",
  "Work History Matching",
  "Incoming Reviews",
  "Reputation Dashboard",
  "Give Reviews",
  "Employee Benefits",
];

const slide = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export default function EmployeeDemoClient() {
  const [step, setStep] = useState(1);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [visibleReviews, setVisibleReviews] = useState<DemoReview[]>([]);
  const [reviewSent, setReviewSent] = useState<Set<string>>(new Set());
  const [draftReviews, setDraftReviews] = useState<
    Record<string, { reliability: number; teamwork: number; communication: number; text: string }>
  >(() =>
    Object.fromEntries(
      REVIEW_TARGETS.map((t) => [
        t.id,
        { reliability: 5, teamwork: 5, communication: 4, text: "" },
      ]),
    ),
  );

  const goNext = useCallback(() => setStep((s) => Math.min(s + 1, STEPS.length)), []);
  const goBack = useCallback(() => setStep((s) => Math.max(s - 1, 1)), []);

  const requestReview = (id: string) => {
    if (requestedIds.has(id)) return;
    setSendingId(id);
    setTimeout(() => {
      setRequestedIds((prev) => new Set(prev).add(id));
      setSendingId(null);
    }, 900);
  };

  useEffect(() => {
    if (step !== 3) return;
    setVisibleReviews([]);
    const timers: ReturnType<typeof setTimeout>[] = [];
    INCOMING_REVIEWS.forEach((review, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleReviews((prev) => [...prev, review]);
        }, 600 + i * 700),
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [step]);

  const allRequested = COWORKER_MATCHES.every((m) => requestedIds.has(m.id));

  return (
    <DemoShell
      flow="employee"
      step={step}
      totalSteps={STEPS.length}
      stepLabel={STEPS[step - 1]}
    >
      <AnimatePresence mode="wait">
        {/* Step 1: Signup */}
        {step === 1 && (
          <motion.div key="s1" {...slide} transition={{ duration: 0.35 }}>
            <div className="max-w-2xl mx-auto">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Welcome to WorkVouch
              </h1>
              <p className="mt-2 text-gray-600">
                Let&apos;s set up your verified professional profile.
              </p>

              {!onboardingDone ? (
                <Card className="mt-8 border-blue-100" featured>
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white">
                      MJ
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">
                        {DEMO_EMPLOYEE.name}
                      </p>
                      <p className="text-blue-600 font-medium">
                        {DEMO_EMPLOYEE.title}
                      </p>
                      <p className="text-sm text-gray-500">{DEMO_EMPLOYEE.location}</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                      Email
                      <input
                        readOnly
                        value={DEMO_EMPLOYEE.email}
                        className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm"
                      />
                    </label>
                    <label className="text-sm font-medium text-gray-700">
                      Career focus
                      <input
                        readOnly
                        value={DEMO_EMPLOYEE.title}
                        className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm"
                      />
                    </label>
                  </div>

                  <div className="mt-6">
                    <p className="text-sm font-semibold text-gray-800 mb-3">
                      Previous employers
                    </p>
                    <div className="space-y-2">
                      {DEMO_EMPLOYEE.employers.map((emp) => (
                        <div
                          key={emp.name}
                          className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{emp.name}</p>
                            <p className="text-xs text-gray-500">
                              {emp.role} · {emp.dates}
                            </p>
                          </div>
                          <CheckBadgeSolid className="h-5 w-5 text-emerald-500" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="mt-8 w-full"
                    size="lg"
                    onClick={() => setOnboardingDone(true)}
                  >
                    Complete onboarding
                  </Button>
                </Card>
              ) : (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-8 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-8 text-center"
                >
                  <CheckBadgeIcon className="mx-auto h-12 w-12 text-emerald-600" />
                  <p className="mt-4 text-lg font-bold text-gray-900">
                    Profile created successfully!
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    Next, we&apos;ll find coworkers who worked with you and help you
                    collect verified reviews.
                  </p>
                  <Button className="mt-6" size="lg" onClick={goNext}>
                    Continue <ArrowRightIcon className="ml-1 h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </div>
            <ValueSection blocks={EMPLOYEE_VALUE_BLOCKS} />
          </motion.div>
        )}

        {/* Step 2: Coworker matching */}
        {step === 2 && (
          <motion.div key="s2" {...slide} transition={{ duration: 0.35 }}>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              We found coworkers who worked with you
            </h1>
            <p className="mt-2 text-gray-600 flex items-center gap-1 flex-wrap">
              Matches are based on{" "}
              <DemoTooltipLabel label="Peer Verification" tooltipKey="peerVerification" />
              — employer, dates, and department overlap.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {COWORKER_MATCHES.map((match) => {
                const sent = requestedIds.has(match.id);
                const sending = sendingId === match.id;
                return (
                  <Card key={match.id} hover className="relative overflow-hidden">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white ${match.avatarColor}`}
                      >
                        {match.name.split(" ")[0][0]}
                        {match.name.split(" ")[1]?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{match.name}</p>
                        <p className="text-xs text-gray-500">{match.company}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-1 text-xs text-gray-600">
                      <p>
                        <span className="font-medium text-gray-800">Department:</span>{" "}
                        {match.department}
                      </p>
                      <p>
                        <span className="font-medium text-gray-800">Overlap:</span>{" "}
                        {match.overlap}
                      </p>
                    </div>
                    <Button
                      className="mt-4 w-full gap-2"
                      variant={sent ? "secondary" : "primary"}
                      disabled={sent || sending}
                      onClick={() => requestReview(match.id)}
                    >
                      {sending ? (
                        <>
                          <motion.span
                            animate={{ x: [0, 4, 0] }}
                            transition={{ repeat: Infinity, duration: 0.6 }}
                          >
                            <PaperAirplaneIcon className="h-4 w-4" />
                          </motion.span>
                          Sending…
                        </>
                      ) : sent ? (
                        <>Request sent ✓</>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="h-4 w-4" />
                          Request Review
                        </>
                      )}
                    </Button>
                  </Card>
                );
              })}
            </div>

            {allRequested && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 rounded-xl bg-blue-50 border border-blue-100 px-5 py-4 text-sm text-blue-900"
              >
                All review requests sent! Coworkers typically respond within 48
                hours — watch reviews arrive in the next step.
              </motion.div>
            )}

            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={goBack}>
                <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={goNext} disabled={!allRequested}>
                View incoming reviews <ArrowRightIcon className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <ValueSection blocks={EMPLOYEE_VALUE_BLOCKS} />
          </motion.div>
        )}

        {/* Step 3: Incoming reviews */}
        {step === 3 && (
          <motion.div key="s3" {...slide} transition={{ duration: 0.35 }}>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Reviews are arriving
            </h1>
            <p className="mt-2 text-gray-600">
              Real feedback from verified coworkers builds your{" "}
              <DemoTooltipLabel label="Trust Score" tooltipKey="trustScore" />.
            </p>

            <div className="mt-8 space-y-4">
              {visibleReviews.length === 0 && (
                <Card className="text-center py-12 text-gray-500">
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    Waiting for reviews…
                  </motion.div>
                </Card>
              )}
              <AnimatePresence>
                {visibleReviews.map((review) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  >
                    <Card className="border-emerald-100 bg-emerald-50/30" hover>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                            {review.reviewerInitials}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {review.reviewerName}
                            </p>
                            <p className="text-xs text-gray-500">{review.company}</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full px-2.5 py-1">
                          {review.receivedAt}
                        </span>
                      </div>
                      <p className="mt-4 text-gray-700 text-sm leading-relaxed italic">
                        &ldquo;{review.quote}&rdquo;
                      </p>
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {(Object.entries(review.ratings) as [string, number][]).map(
                          ([cat, val]) => (
                            <div key={cat} className="text-center">
                              <p className="text-[10px] font-semibold uppercase text-gray-500">
                                {cat}
                              </p>
                              <p className="text-sm font-bold text-gray-900 mt-0.5">
                                {val}/5
                              </p>
                              <StarRating value={val} />
                            </div>
                          ),
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={goBack}>
                <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={goNext}
                disabled={visibleReviews.length < INCOMING_REVIEWS.length}
              >
                View reputation dashboard <ArrowRightIcon className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <ValueSection blocks={EMPLOYEE_VALUE_BLOCKS} />
          </motion.div>
        )}

        {/* Step 4: Reputation dashboard */}
        {step === 4 && (
          <motion.div key="s4" {...slide} transition={{ duration: 0.35 }}>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Your Reputation Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              A complete view of your verified workplace reputation.
            </p>

            <div className="mt-8 grid lg:grid-cols-2 gap-6">
              <Card featured className="text-center">
                <DemoTooltipLabel
                  label="WorkVouch Trust Score"
                  tooltipKey="trustScore"
                />
                <p className="mt-4 text-6xl font-bold text-emerald-600 tabular-nums">
                  <AnimatedCounter value={DEMO_EMPLOYEE.trustScore} />
                </p>
                <p className="text-sm text-gray-500 mt-1">out of 100</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {DEMO_EMPLOYEE.strengths.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </Card>

              <Card>
                <p className="font-semibold text-gray-900 mb-4">Skills breakdown</p>
                <DemoRadarChart data={DEMO_EMPLOYEE.skillBreakdown} />
              </Card>

              <Card>
                <p className="font-semibold text-gray-900 mb-4">Top Endorsements</p>
                <div className="flex flex-wrap gap-2">
                  {DEMO_EMPLOYEE.topEndorsements.map((e) => (
                    <span
                      key={e}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-sm font-medium text-blue-800"
                    >
                      <SparklesIcon className="h-4 w-4" />
                      {e}
                    </span>
                  ))}
                </div>
                <div className="mt-6 space-y-3">
                  {DEMO_EMPLOYEE.skillBreakdown.slice(0, 4).map((s) => (
                    <SkillBar key={s.subject} label={s.subject} score={s.value} />
                  ))}
                </div>
              </Card>

              <Card>
                <p className="font-semibold text-gray-900 mb-2">
                  <DemoTooltipLabel
                    label="Consistency Metrics"
                    tooltipKey="consistencyMetrics"
                  />
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Your ratings are highly consistent across 3 employers and 6
                  reviewers — a strong reliability signal.
                </p>
                <div className="space-y-3">
                  <SkillBar label="Cross-employer consistency" score={94} color="bg-emerald-600" />
                  <div className="flex items-center justify-between text-sm mb-1">
                    <DemoTooltipLabel label="Reference quality" tooltipKey="referenceQuality" />
                    <span className="tabular-nums text-gray-900 font-semibold">91</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 mb-3">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-1000 ease-out"
                      style={{ width: "91%" }}
                    />
                  </div>
                  <SkillBar label="Review recency" score={88} color="bg-indigo-600" />
                </div>
              </Card>
            </div>

            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={goBack}>
                <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={goNext}>
                Give reviews to coworkers <ArrowRightIcon className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <ValueSection blocks={EMPLOYEE_VALUE_BLOCKS} />
          </motion.div>
        )}

        {/* Step 5: Give reviews */}
        {step === 5 && (
          <motion.div key="s5" {...slide} transition={{ duration: 0.35 }}>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Give Reviews to Former Coworkers
            </h1>
            <p className="mt-2 text-gray-600">
              WorkVouch is built on fairness — help others build verified reputations
              too.
            </p>

            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <Card className="border-amber-100 bg-amber-50/50">
                <p className="font-semibold text-amber-900 text-sm">
                  Fairness reminders
                </p>
                <ul className="mt-2 space-y-1 text-sm text-amber-800 list-disc pl-5">
                  <li>Be honest, specific, and constructive</li>
                  <li>Focus on workplace behavior you directly observed</li>
                  <li>Avoid personal attacks or protected-class references</li>
                  <li>Reviews are tied to verified work overlap</li>
                </ul>
              </Card>
              <Card className="border-blue-100 bg-blue-50/50">
                <p className="font-semibold text-blue-900 text-sm">
                  Professional review guidelines
                </p>
                <ul className="mt-2 space-y-1 text-sm text-blue-800 list-disc pl-5">
                  <li>Describe specific situations, not vague impressions</li>
                  <li>Balance strengths with areas for growth when relevant</li>
                  <li>Use professional language suitable for hiring decisions</li>
                  <li>Only review people you worked with directly</li>
                </ul>
              </Card>
            </div>

            <div className="mt-8 grid md:grid-cols-2 gap-6">
              {REVIEW_TARGETS.map((target) => (
                <Card key={target.id} hover>
                  <div className="flex items-center gap-3">
                    <UserCircleIcon className="h-10 w-10 text-gray-400" />
                    <div>
                      <p className="font-semibold text-gray-900">{target.name}</p>
                      <p className="text-xs text-gray-500">
                        {target.role} · {target.company}
                      </p>
                    </div>
                  </div>
                  {reviewSent.has(target.id) ? (
                    <p className="mt-4 text-sm font-medium text-emerald-700">
                      Review submitted — thank you for giving back!
                    </p>
                  ) : (
                    <>
                      <p className="mt-4 text-xs font-medium text-gray-700">
                        Constructive feedback prompt: What made this coworker
                        effective on your team?
                      </p>
                      <textarea
                        className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[80px]"
                        placeholder="Share specific, professional observations…"
                        value={draftReviews[target.id]?.text ?? ""}
                        onChange={(e) =>
                          setDraftReviews((prev) => ({
                            ...prev,
                            [target.id]: {
                              ...prev[target.id],
                              text: e.target.value,
                            },
                          }))
                        }
                      />
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                        {(["reliability", "teamwork", "communication"] as const).map(
                          (key) => (
                            <label key={key} className="capitalize">
                              {key}
                              <input
                                type="range"
                                min={1}
                                max={5}
                                value={draftReviews[target.id]?.[key] ?? 5}
                                onChange={(e) =>
                                  setDraftReviews((prev) => ({
                                    ...prev,
                                    [target.id]: {
                                      ...prev[target.id],
                                      [key]: Number(e.target.value),
                                    },
                                  }))
                                }
                                className="w-full mt-1"
                              />
                              {draftReviews[target.id]?.[key] ?? 5}/5
                            </label>
                          ),
                        )}
                      </div>
                      <Button
                        className="mt-4 w-full"
                        onClick={() =>
                          setReviewSent((prev) => new Set(prev).add(target.id))
                        }
                      >
                        Submit review
                      </Button>
                    </>
                  )}
                </Card>
              ))}
            </div>

            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={goBack}>
                <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={goNext}>
                See your benefits <ArrowRightIcon className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <ValueSection blocks={EMPLOYEE_VALUE_BLOCKS} />
          </motion.div>
        )}

        {/* Step 6: Benefits */}
        {step === 6 && (
          <motion.div key="s6" {...slide} transition={{ duration: 0.35 }}>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
              Your WorkVouch Benefits
            </h1>
            <p className="mt-2 text-gray-600 text-center max-w-xl mx-auto">
              Turn years of hard work into a verified reputation employers trust.
            </p>

            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {EMPLOYEE_BENEFITS.map((benefit, i) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card hover className="h-full text-center py-6">
                    <CheckBadgeSolid className="mx-auto h-8 w-8 text-blue-600" />
                    <p className="mt-3 font-semibold text-gray-900 text-sm">
                      {benefit}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
              <Button href="/experience/employer" size="lg" className="gap-2">
                See Employer Experience
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
              <Button href="/experience" variant="outline" size="lg">
                Back to home
              </Button>
            </div>
            <ValueSection blocks={EMPLOYEE_VALUE_BLOCKS} />
          </motion.div>
        )}
      </AnimatePresence>
    </DemoShell>
  );
}
