"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Send,
  Briefcase,
  Award,
  MapPin,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import { DemoShell } from "@/components/demo-center/DemoShell";
import {
  GlassCard,
  DemoButton,
  StarRating,
  SkillBar,
} from "@/components/demo-center/shared/DemoUI";
import {
  ScreenHeader,
  WhyItMatters,
  FlowNav,
  StaggerGrid,
  staggerItem,
  pageTransition,
} from "@/components/demo-center/shared/FlowLayout";
import {
  TrustScoreAnimation,
  LoadingDots,
  SuccessPulse,
} from "@/components/demo-center/shared/DemoAnimations";
import { DemoRadarChart, DemoBarChart } from "@/components/demo-center/shared/DemoCharts";
import {
  EMPLOYEE,
  COWORKERS,
  REVIEWS,
  REVIEW_TARGETS,
  CAREER_TIMELINE,
  JOB_MATCHES,
  FAIRNESS_GUIDELINES,
  EMPLOYEE_STEP_INSIGHTS,
  type DemoReview,
} from "@/lib/demo/demo-center-data";

const STEPS = EMPLOYEE_STEP_INSIGHTS.map((s) => s.title);

const timelineIcon = {
  job: Briefcase,
  review: Sparkles,
  skill: Award,
  badge: Award,
};

function StepShell({
  stepIndex,
  children,
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  showBack = true,
}: {
  stepIndex: number;
  children: React.ReactNode;
  onBack: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
}) {
  const insight = EMPLOYEE_STEP_INSIGHTS[stepIndex];
  return (
    <>
      <ScreenHeader insight={insight} />
      <WhyItMatters text={insight.whyItMatters} />
      {children}
      <FlowNav
        onBack={onBack}
        onNext={onNext}
        nextLabel={nextLabel}
        nextDisabled={nextDisabled}
        showBack={showBack}
      />
    </>
  );
}

export default function EmployeeFlow() {
  const [step, setStep] = useState(1);
  const [profileDone, setProfileDone] = useState(false);
  const [profileProgress, setProfileProgress] = useState(0);
  const [searching, setSearching] = useState(true);
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState<string | null>(null);
  const [visibleReviews, setVisibleReviews] = useState<DemoReview[]>([]);
  const [submittedReviews, setSubmittedReviews] = useState<Set<string>>(new Set());

  const goNext = useCallback(() => setStep((s) => Math.min(s + 1, STEPS.length)), []);
  const goBack = useCallback(() => setStep((s) => Math.max(s - 1, 1)), []);

  useEffect(() => {
    if (step !== 1 || profileDone) return;
    const timers = [0, 400, 800, 1200].map((ms, i) =>
      setTimeout(() => setProfileProgress((i + 1) * 25), ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [step, profileDone]);

  useEffect(() => {
    if (step !== 2) return;
    setSearching(true);
    const t = setTimeout(() => setSearching(false), 1800);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (step !== 3) return;
    setVisibleReviews([]);
    const timers = REVIEWS.map((r, i) =>
      setTimeout(() => setVisibleReviews((prev) => [...prev, r]), 500 + i * 600),
    );
    return () => timers.forEach(clearTimeout);
  }, [step]);

  const requestReview = (id: string) => {
    if (requested.has(id)) return;
    setSending(id);
    setTimeout(() => {
      setRequested((p) => new Set(p).add(id));
      setSending(null);
    }, 800);
  };

  const allRequested = COWORKERS.every((c) => requested.has(c.id));
  const insight = EMPLOYEE_STEP_INSIGHTS[step - 1];

  return (
    <DemoShell
      flow="employee"
      step={step}
      totalSteps={STEPS.length}
      stepLabel={insight?.eyebrow ?? `Step ${step}`}
      onBack={goBack}
    >
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="e1" {...pageTransition} transition={{ duration: 0.35 }}>
            <ScreenHeader insight={EMPLOYEE_STEP_INSIGHTS[0]} />
            <WhyItMatters text={EMPLOYEE_STEP_INSIGHTS[0].whyItMatters} />

            <GlassCard glow className="max-w-2xl">
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl font-bold shadow-lg shadow-blue-500/30"
                >
                  MJ
                </motion.div>
                <div>
                  <p className="text-xl font-bold">{EMPLOYEE.name}</p>
                  <p className="text-blue-400 font-medium">{EMPLOYEE.title}</p>
                </div>
              </div>

              {!profileDone ? (
                <>
                  <StaggerGrid className="mt-6 space-y-3">
                    {EMPLOYEE.employers.map((emp) => (
                      <motion.div
                        key={emp.name}
                        variants={staggerItem}
                        className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-xs text-white/50">{emp.role} · {emp.dates}</p>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden />
                      </motion.div>
                    ))}
                  </StaggerGrid>
                  <div className="mt-6">
                    <div className="flex justify-between text-xs text-white/50 mb-1.5">
                      <span>Creating profile</span>
                      <span aria-live="polite">{profileProgress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden" role="progressbar" aria-valuenow={profileProgress} aria-valuemin={0} aria-valuemax={100}>
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-violet-500"
                        animate={{ width: `${profileProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                  <DemoButton className="mt-6 w-full" size="lg" onClick={() => setProfileDone(true)}>
                    Complete profile
                  </DemoButton>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 text-center py-4">
                  <SuccessPulse>
                    <CheckCircle2 className="h-12 w-12 text-emerald-400" aria-hidden />
                  </SuccessPulse>
                  <p className="mt-4 font-semibold">Profile created!</p>
                  <DemoButton className="mt-6" onClick={goNext}>Find coworkers</DemoButton>
                </motion.div>
              )}
            </GlassCard>
            {!profileDone && <FlowNav onBack={goBack} showBack={false} />}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="e2" {...pageTransition} transition={{ duration: 0.35 }}>
            <ScreenHeader insight={EMPLOYEE_STEP_INSIGHTS[1]} />
            <WhyItMatters text={EMPLOYEE_STEP_INSIGHTS[1].whyItMatters} />
            {searching ? (
              <LoadingDots label="Searching for verified coworkers" />
            ) : (
              <>
                <p className="mb-6 text-emerald-400 font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Found {COWORKERS.length} coworkers who worked with you
                </p>
                <StaggerGrid className="grid sm:grid-cols-3 gap-4">
                  {COWORKERS.map((c) => {
                    const sent = requested.has(c.id);
                    const isSending = sending === c.id;
                    return (
                      <motion.div key={c.id} variants={staggerItem}>
                        <GlassCard hover className="h-full">
                          <div className={`h-11 w-11 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-sm font-bold mb-3 shadow-lg`}>
                            {c.name.split(" ")[0][0]}{c.name.split(" ")[1]?.[0]}
                          </div>
                          <p className="font-semibold">{c.name}</p>
                          <p className="text-xs text-white/50">{c.company}</p>
                          <p className="text-xs text-white/40 mt-2">{c.overlap}</p>
                          <DemoButton
                            className="mt-4 w-full"
                            variant={sent ? "secondary" : "primary"}
                            size="sm"
                            disabled={sent || isSending}
                            onClick={() => requestReview(c.id)}
                            ariaLabel={sent ? `Review request sent to ${c.name}` : `Request review from ${c.name}`}
                          >
                            {isSending ? (
                              <motion.span className="inline-flex items-center gap-1" animate={{ x: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>
                                <Send className="h-4 w-4" aria-hidden /> Sending…
                              </motion.span>
                            ) : sent ? (
                              "Request sent ✓"
                            ) : (
                              "Request Review"
                            )}
                          </DemoButton>
                        </GlassCard>
                      </motion.div>
                    );
                  })}
                </StaggerGrid>
                {allRequested && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-sm text-blue-300/80 text-center">
                    All requests sent — reviews typically arrive within 48 hours.
                  </motion.p>
                )}
              </>
            )}
            {!searching && (
              <FlowNav onBack={goBack} onNext={goNext} nextLabel="View reviews" nextDisabled={!allRequested} />
            )}
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="e3" {...pageTransition} transition={{ duration: 0.35 }}>
            <StepShell stepIndex={2} onBack={goBack} onNext={goNext} nextLabel="See Trust Score" nextDisabled={visibleReviews.length < REVIEWS.length}>
              <div className="space-y-4" aria-live="polite">
                {visibleReviews.length === 0 && (
                  <GlassCard className="text-center py-8">
                    <LoadingDots label="Waiting for reviews" />
                  </GlassCard>
                )}
                <AnimatePresence>
                  {visibleReviews.map((r) => (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}>
                      <GlassCard className="border-emerald-500/20 bg-emerald-500/[0.03]">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex gap-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-500/30 flex items-center justify-center text-xs font-bold shrink-0">{r.initials}</div>
                            <div>
                              <p className="font-semibold">{r.reviewerName}</p>
                              <p className="text-xs text-white/50">{r.company}</p>
                            </div>
                          </div>
                          <span className="text-xs text-emerald-400 shrink-0">{r.receivedAt}</span>
                        </div>
                        <p className="mt-4 text-white/80 italic leading-relaxed">&ldquo;{r.quote}&rdquo;</p>
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {(Object.entries(r.ratings) as [string, number][]).map(([cat, val]) => (
                            <div key={cat} className="text-center rounded-lg bg-white/5 py-2">
                              <p className="text-[10px] uppercase tracking-wide text-white/40">{cat}</p>
                              <StarRating value={val} />
                            </div>
                          ))}
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </StepShell>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="e4" {...pageTransition} transition={{ duration: 0.35 }}>
            <ScreenHeader insight={EMPLOYEE_STEP_INSIGHTS[3]} />
            <WhyItMatters text={EMPLOYEE_STEP_INSIGHTS[3].whyItMatters} />
            <GlassCard glow className="max-w-lg mx-auto">
              <TrustScoreAnimation steps={EMPLOYEE.trustScoreSteps} />
            </GlassCard>
            <FlowNav onBack={goBack} onNext={goNext} nextLabel="View analytics" />
          </motion.div>
        )}

        {step === 5 && (
          <motion.div key="e5" {...pageTransition} transition={{ duration: 0.35 }}>
            <StepShell stepIndex={4} onBack={goBack} onNext={goNext} nextLabel="Give reviews">
              <div className="grid lg:grid-cols-2 gap-6">
                <GlassCard>
                  <p className="font-semibold mb-4 text-white/90">Skills radar</p>
                  <DemoRadarChart data={EMPLOYEE.skillRadar} />
                </GlassCard>
                <GlassCard>
                  <p className="font-semibold mb-4 text-white/90">Top strengths</p>
                  <DemoBarChart data={EMPLOYEE.skillRadar.slice(0, 4)} />
                  <div className="mt-6 flex flex-wrap gap-2">
                    {EMPLOYEE.strengths.map((s) => (
                      <motion.span key={s} whileHover={{ scale: 1.05 }} className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-medium text-emerald-300">{s}</motion.span>
                    ))}
                  </div>
                </GlassCard>
                <GlassCard className="lg:col-span-2">
                  <p className="font-semibold mb-4 text-white/90">Growth areas</p>
                  <div className="space-y-4">
                    {EMPLOYEE.growthAreas.map((g, i) => (
                      <SkillBar key={g} label={g} score={65} color="from-amber-500 to-orange-500" delay={i * 100} />
                    ))}
                  </div>
                </GlassCard>
              </div>
            </StepShell>
          </motion.div>
        )}

        {step === 6 && (
          <motion.div key="e6" {...pageTransition} transition={{ duration: 0.35 }}>
            <StepShell stepIndex={5} onBack={goBack} onNext={goNext} nextLabel="Career timeline">
              <GlassCard className="border-amber-500/20 bg-amber-500/5 mb-6">
                <p className="font-semibold text-amber-300 text-sm">Fairness reminders</p>
                <ul className="mt-2 space-y-1.5 text-sm text-white/70 list-disc pl-5">
                  {FAIRNESS_GUIDELINES.map((g) => <li key={g}>{g}</li>)}
                </ul>
              </GlassCard>
              <div className="grid md:grid-cols-2 gap-4">
                {REVIEW_TARGETS.map((t) => (
                  <GlassCard key={t.id} hover>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-xs text-white/50">{t.role} · {t.company}</p>
                    {submittedReviews.has(t.id) ? (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-emerald-400 text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" aria-hidden /> Review submitted — thank you!
                      </motion.p>
                    ) : (
                      <>
                        <label htmlFor={`review-${t.id}`} className="sr-only">Review for {t.name}</label>
                        <textarea
                          id={`review-${t.id}`}
                          className="mt-4 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm min-h-[80px] text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                          placeholder="Share specific, professional observations…"
                        />
                        <DemoButton className="mt-3 w-full" size="sm" onClick={() => setSubmittedReviews((p) => new Set(p).add(t.id))}>
                          Submit review
                        </DemoButton>
                      </>
                    )}
                  </GlassCard>
                ))}
              </div>
            </StepShell>
          </motion.div>
        )}

        {step === 7 && (
          <motion.div key="e7" {...pageTransition} transition={{ duration: 0.35 }}>
            <StepShell stepIndex={6} onBack={goBack} onNext={goNext} nextLabel="Job matches">
              <div className="relative">
                <div className="absolute left-[1.65rem] top-2 bottom-2 w-px bg-gradient-to-b from-blue-500/50 via-violet-500/30 to-transparent" aria-hidden />
                <div className="space-y-5">
                  {CAREER_TIMELINE.map((ev, i) => {
                    const Icon = timelineIcon[ev.type];
                    return (
                      <motion.div key={ev.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="relative flex gap-4 pl-14">
                        <div className="absolute left-2.5 h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-4 ring-[#0a0a0f]">
                          <Icon className="h-3.5 w-3.5" aria-hidden />
                        </div>
                        <GlassCard className="flex-1 py-4 hover:bg-white/[0.08]">
                          <p className="text-xs text-blue-400 font-semibold tracking-wide">{ev.year}</p>
                          <p className="font-semibold mt-0.5">{ev.title}</p>
                          <p className="text-sm text-white/55">{ev.subtitle}</p>
                        </GlassCard>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </StepShell>
          </motion.div>
        )}

        {step === 8 && (
          <motion.div key="e8" {...pageTransition} transition={{ duration: 0.35 }}>
            <StepShell stepIndex={7} onBack={goBack} onNext={goNext} nextLabel="Your benefits">
              <StaggerGrid className="grid sm:grid-cols-2 gap-4">
                {JOB_MATCHES.map((j) => (
                  <motion.div key={j.id} variants={staggerItem}>
                    <GlassCard hover className="h-full">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wide text-violet-400">{j.industry}</span>
                          <p className="font-semibold mt-1">{j.company}</p>
                          <p className="text-sm text-white/60">{j.role}</p>
                          <p className="text-xs text-white/40 mt-2 flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden />{j.location}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] uppercase text-white/40">Match</p>
                          <p className="text-2xl font-bold text-emerald-400 tabular-nums">{j.trustMatch}%</p>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </StaggerGrid>
            </StepShell>
          </motion.div>
        )}

        {step === 9 && (
          <motion.div key="e9" {...pageTransition} transition={{ duration: 0.35 }}>
            <StepShell stepIndex={8} onBack={goBack} onNext={goNext} nextLabel="Finish">
              <StaggerGrid className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {EMPLOYEE.benefits.map((b) => (
                  <motion.div key={b} variants={staggerItem}>
                    <GlassCard hover className="text-center py-6 h-full">
                      <CheckCircle2 className="mx-auto h-8 w-8 text-blue-400" aria-hidden />
                      <p className="mt-3 font-semibold text-sm leading-snug">{b}</p>
                    </GlassCard>
                  </motion.div>
                ))}
              </StaggerGrid>
            </StepShell>
          </motion.div>
        )}

        {step === 10 && (
          <motion.div key="e10" {...pageTransition} transition={{ duration: 0.35 }} className="text-center">
            <ScreenHeader insight={EMPLOYEE_STEP_INSIGHTS[9]} />
            <WhyItMatters text={EMPLOYEE_STEP_INSIGHTS[9].whyItMatters} />
            <SuccessPulse>
              <PartyPopper className="mx-auto h-16 w-16 text-violet-400" aria-hidden />
            </SuccessPulse>
            <p className="mt-6 text-white/60 max-w-md mx-auto leading-relaxed">
              Your WorkVouch profile is ready. Employers can now see your verified reputation.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <DemoButton href="/demo/employer" size="lg">See Employer Experience</DemoButton>
              <DemoButton href="/demo" variant="outline" size="lg">Back to Demo Center</DemoButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DemoShell>
  );
}
