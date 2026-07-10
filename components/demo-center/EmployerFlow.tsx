"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Clock,
  Users,
  Sparkles,
  PartyPopper,
  ShieldCheck,
} from "lucide-react";
import { DemoShell } from "@/components/demo-center/DemoShell";
import {
  GlassCard,
  DemoButton,
  SkillBar,
  AnimatedCounter,
} from "@/components/demo-center/shared/DemoUI";
import {
  ScreenHeader,
  WhyItMatters,
  FlowNav,
  StaggerGrid,
  staggerItem,
  pageTransition,
  FeatureLabel,
} from "@/components/demo-center/shared/FlowLayout";
import {
  DemoRadarChart,
  CompareBarChart,
  WordCloud,
} from "@/components/demo-center/shared/DemoCharts";
import { Confetti, SuccessPulse } from "@/components/demo-center/shared/DemoAnimations";
import {
  EMPLOYER,
  DASHBOARD_STATS,
  CANDIDATES,
  COMPARE_METRICS,
  ROI_STATS,
  EMPLOYER_STEP_INSIGHTS,
  type DemoCandidate,
} from "@/lib/demo/demo-center-data";
import { cn } from "@/lib/utils";

const STEPS = EMPLOYER_STEP_INSIGHTS.map((s) => s.title);

function trustColor(score: number) {
  if (score >= 90) return "text-emerald-400";
  if (score >= 80) return "text-blue-400";
  return "text-amber-400";
}

function StepShell({
  stepIndex,
  children,
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
}: {
  stepIndex: number;
  children: React.ReactNode;
  onBack: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  const insight = EMPLOYER_STEP_INSIGHTS[stepIndex];
  return (
    <>
      <ScreenHeader insight={insight} />
      <WhyItMatters text={insight.whyItMatters} />
      {children}
      <FlowNav onBack={onBack} onNext={onNext} nextLabel={nextLabel} nextDisabled={nextDisabled} />
    </>
  );
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
    <GlassCard
      hover
      onClick={onSelect}
      ariaLabel={`Select ${candidate.name}, trust score ${candidate.trustScore}`}
      className={cn(
        "transition-all",
        selected && "ring-2 ring-blue-500/50 bg-blue-500/10 scale-[1.02]",
      )}
    >
      <div className="flex justify-between items-start gap-3">
        <div>
          <p className="font-bold text-lg">{candidate.name}</p>
          <p className="text-sm text-white/50">{candidate.title}</p>
          <p className="text-xs text-white/40 mt-0.5">{candidate.location}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-white/40">Trust Score</p>
          <p className={cn("text-3xl font-bold tabular-nums", trustColor(candidate.trustScore))}>
            {candidate.trustScore}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-white/45">
        {candidate.verifiedJobs} verified jobs · {candidate.verifiedCoworkers} coworkers
      </p>
    </GlassCard>
  );
}

export default function EmployerFlow() {
  const [step, setStep] = useState(1);
  const [onboarded, setOnboarded] = useState(false);
  const [selectedId, setSelectedId] = useState("marcus");
  const [hired, setHired] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const goNext = useCallback(() => setStep((s) => Math.min(s + 1, STEPS.length)), []);
  const goBack = useCallback(() => setStep((s) => Math.max(s - 1, 1)), []);

  const selected = CANDIDATES.find((c) => c.id === selectedId) ?? CANDIDATES[0];
  const insight = EMPLOYER_STEP_INSIGHTS[step - 1];

  const handleHire = () => {
    setHired(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3500);
  };

  const compareData = COMPARE_METRICS.map((metric) => {
    const key = metric === "Trust Score" ? "trustScore" : metric.toLowerCase();
    const row: Record<string, string | number> = { metric };
    CANDIDATES.forEach((c) => {
      const val =
        metric === "Trust Score"
          ? c.trustScore
          : c.metrics[key as keyof typeof c.metrics] ?? 0;
      row[c.name.split(" ")[0]] = val;
    });
    return row;
  });

  return (
    <DemoShell
      flow="employer"
      step={step}
      totalSteps={STEPS.length}
      stepLabel={insight?.eyebrow ?? `Step ${step}`}
      onBack={goBack}
    >
      {showConfetti && <Confetti />}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="r1" {...pageTransition} transition={{ duration: 0.35 }}>
            <ScreenHeader insight={EMPLOYER_STEP_INSIGHTS[0]} />
            <WhyItMatters text={EMPLOYER_STEP_INSIGHTS[0].whyItMatters} />
            <GlassCard glow className="max-w-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Building2 className="h-7 w-7" aria-hidden />
                </div>
                <div>
                  <p className="text-lg font-bold">{EMPLOYER.company}</p>
                  <p className="text-violet-400 text-sm">Hiring: {EMPLOYER.hiringRole}</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Company", value: EMPLOYER.company },
                  { label: "Contact", value: `${EMPLOYER.contactName} — ${EMPLOYER.contactTitle}` },
                  { label: "Role", value: EMPLOYER.hiringRole },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-xs font-medium text-white/50">{f.label}</label>
                    <input readOnly value={f.value} aria-readonly className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm focus:outline-none" />
                  </div>
                ))}
              </div>
              {!onboarded ? (
                <DemoButton className="mt-8 w-full" size="lg" onClick={() => setOnboarded(true)}>
                  Create employer account
                </DemoButton>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center py-2">
                  <SuccessPulse>
                    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" aria-hidden />
                  </SuccessPulse>
                  <p className="mt-3 font-semibold">Account ready!</p>
                  <DemoButton className="mt-4" onClick={goNext}>Open dashboard</DemoButton>
                </motion.div>
              )}
            </GlassCard>
            {!onboarded && <FlowNav onBack={goBack} showBack={false} />}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="r2" {...pageTransition} transition={{ duration: 0.35 }}>
            <StepShell stepIndex={1} onBack={goBack} onNext={goNext} nextLabel="Search candidates">
              <StaggerGrid className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Applications today", value: DASHBOARD_STATS.applicationsToday, icon: Users },
                  { label: "Avg trust score", value: DASHBOARD_STATS.avgTrustScore, icon: ShieldCheck },
                  { label: "Open positions", value: DASHBOARD_STATS.openPositions, icon: Building2 },
                  { label: "In pipeline", value: DASHBOARD_STATS.pipeline.reduce((a, p) => a + p.count, 0), icon: TrendingDown },
                ].map((s) => (
                  <motion.div key={s.label} variants={staggerItem}>
                    <GlassCard hover className="h-full">
                      <s.icon className="h-5 w-5 text-blue-400 mb-2" aria-hidden />
                      <p className="text-3xl font-bold tabular-nums"><AnimatedCounter value={s.value} /></p>
                      <p className="text-xs text-white/50 mt-1">{s.label}</p>
                    </GlassCard>
                  </motion.div>
                ))}
              </StaggerGrid>
              <GlassCard className="mt-6">
                <p className="font-semibold mb-4">Hiring pipeline</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {DASHBOARD_STATS.pipeline.map((p, i) => (
                    <div key={p.stage}>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 to-violet-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${(p.count / 42) * 100}%` }}
                          transition={{ delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                      <p className="text-xs text-white/50 mt-2">{p.stage}</p>
                      <p className="text-xl font-bold tabular-nums">{p.count}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </StepShell>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="r3" {...pageTransition} transition={{ duration: 0.35 }}>
            <StepShell stepIndex={2} onBack={goBack} onNext={goNext} nextLabel={`View ${selected.name.split(" ")[0]}'s profile`}>
              <StaggerGrid className="grid md:grid-cols-3 gap-4">
                {CANDIDATES.map((c) => (
                  <motion.div key={c.id} variants={staggerItem}>
                    <CandidateCard candidate={c} selected={selectedId === c.id} onSelect={() => setSelectedId(c.id)} />
                  </motion.div>
                ))}
              </StaggerGrid>
              <GlassCard className="mt-6">
                <p className="text-sm font-semibold mb-3 text-white/80">Quick comparison</p>
                <CompareBarChart candidates={CANDIDATES.map((c) => ({ name: c.name.split(" ")[0], trustScore: c.trustScore }))} />
              </GlassCard>
            </StepShell>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="r4" {...pageTransition} transition={{ duration: 0.35 }}>
            <ScreenHeader insight={EMPLOYER_STEP_INSIGHTS[3]} />
            <WhyItMatters text={EMPLOYER_STEP_INSIGHTS[3].whyItMatters} />
            <div className="flex flex-wrap justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold">{selected.name}</h2>
                <p className="text-white/55">{selected.title} · {selected.location}</p>
              </div>
              <GlassCard className="text-center px-8 py-4 min-w-[140px]">
                <FeatureLabel label="Trust Score" tooltip="Composite score (0–100) from verified reviews, consistency, and reference quality." />
                <p className={cn("text-5xl font-bold tabular-nums mt-1", trustColor(selected.trustScore))}>{selected.trustScore}</p>
              </GlassCard>
            </div>
            <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Select candidate">
              {CANDIDATES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedId === c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50",
                    selectedId === c.id ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25" : "bg-white/10 text-white/70 hover:bg-white/15",
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <GlassCard>
                <p className="font-semibold mb-3">Verified employment</p>
                {selected.workHistory.map((j) => (
                  <div key={j.company} className="flex justify-between py-2.5 border-b border-white/5 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{j.company}</p>
                      <p className="text-xs text-white/50">{j.role} · {j.dates}</p>
                    </div>
                    {j.verified && <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-label="Verified" />}
                  </div>
                ))}
              </GlassCard>
              <GlassCard>
                <p className="font-semibold mb-3">Coworker endorsements</p>
                <div className="flex flex-wrap gap-2">
                  {selected.endorsements.map((e) => (
                    <span key={e} className="rounded-lg bg-blue-500/20 border border-blue-500/30 px-2.5 py-1 text-xs">{e}</span>
                  ))}
                </div>
              </GlassCard>
              <GlassCard>
                <p className="font-semibold mb-3">Skills breakdown</p>
                <DemoRadarChart data={selected.skills} />
              </GlassCard>
              <GlassCard>
                <p className="font-semibold mb-3">Key indicators</p>
                <div className="space-y-3">
                  {[
                    { label: "Attendance", score: selected.metrics.attendance, color: "from-emerald-500 to-teal-500" },
                    { label: "Leadership", score: selected.metrics.leadership, color: "from-violet-500 to-purple-500" },
                    { label: "Reliability", score: selected.metrics.reliability, color: "from-blue-500 to-cyan-500" },
                    { label: "Communication", score: selected.metrics.communication, color: "from-indigo-500 to-blue-500" },
                    { label: "Retention likelihood", score: selected.metrics.retention, color: "from-emerald-500 to-green-500" },
                    { label: "Culture fit", score: selected.metrics.cultureFit, color: "from-teal-500 to-cyan-500" },
                  ].map((m, i) => (
                    <SkillBar key={m.label} label={m.label} score={m.score} color={m.color} delay={i * 80} />
                  ))}
                </div>
              </GlassCard>
            </div>
            <FlowNav onBack={goBack} onNext={goNext} nextLabel="Review breakdown" />
          </motion.div>
        )}

        {step === 5 && (
          <motion.div key="r5" {...pageTransition} transition={{ duration: 0.35 }}>
            <StepShell stepIndex={4} onBack={goBack} onNext={goNext} nextLabel="Compare candidates">
              <div className="grid lg:grid-cols-2 gap-6">
                <GlassCard>
                  <p className="font-semibold mb-3">Strength trends</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.strengths.map((s) => (
                      <span key={s} className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-sm text-emerald-300">{s}</span>
                    ))}
                  </div>
                </GlassCard>
                <GlassCard>
                  <p className="font-semibold mb-3">Most common praise</p>
                  <WordCloud words={selected.praiseWords} variant="praise" />
                </GlassCard>
                <GlassCard className="lg:col-span-2">
                  <p className="font-semibold mb-3">Most common concerns</p>
                  <WordCloud words={selected.concernWords} variant="concern" />
                </GlassCard>
              </div>
            </StepShell>
          </motion.div>
        )}

        {step === 6 && (
          <motion.div key="r6" {...pageTransition} transition={{ duration: 0.35 }}>
            <StepShell stepIndex={5} onBack={goBack} onNext={goNext} nextLabel="Hiring insights">
              <GlassCard className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <caption className="sr-only">Candidate comparison by trust metrics</caption>
                  <thead>
                    <tr className="border-b border-white/10">
                      <th scope="col" className="text-left py-3 text-white/50 font-medium">Metric</th>
                      {CANDIDATES.map((c) => (
                        <th key={c.id} scope="col" className="text-center py-3 font-semibold">{c.name.split(" ")[0]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {compareData.map((row) => (
                      <tr key={row.metric as string} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                        <th scope="row" className="py-3 text-white/70 font-normal text-left">{row.metric as string}</th>
                        {CANDIDATES.map((c) => {
                          const val = row[c.name.split(" ")[0] as string] as number;
                          const best = Math.max(...CANDIDATES.map((x) => row[x.name.split(" ")[0] as string] as number));
                          return (
                            <td key={c.id} className={cn("text-center py-3 font-bold tabular-nums", val === best && "text-emerald-400")}>
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>
            </StepShell>
          </motion.div>
        )}

        {step === 7 && (
          <motion.div key="r7" {...pageTransition} transition={{ duration: 0.35 }}>
            <StepShell stepIndex={6} onBack={goBack} onNext={goNext} nextLabel="Risk detection">
              <GlassCard glow className="max-w-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl" aria-hidden />
                <div className="relative">
                  <div className="flex items-center gap-2 text-violet-400 mb-4">
                    <Sparkles className="h-5 w-5" aria-hidden />
                    <span className="text-sm font-semibold uppercase tracking-wider">WorkVouch Insights</span>
                  </div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="text-lg leading-relaxed text-white/90"
                  >
                    {selected.aiSummary}
                  </motion.p>
                </div>
              </GlassCard>
            </StepShell>
          </motion.div>
        )}

        {step === 8 && (
          <motion.div key="r8" {...pageTransition} transition={{ duration: 0.35 }}>
            <StepShell stepIndex={7} onBack={goBack} onNext={goNext} nextLabel="View ROI">
              <div className="space-y-4 max-w-2xl">
                {selected.riskFlags.map((flag, i) => (
                  <motion.div key={flag.label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                    <GlassCard className={cn(
                      flag.status === "green" && "border-emerald-500/30 bg-emerald-500/5",
                      flag.status === "yellow" && "border-amber-500/30 bg-amber-500/5",
                    )}>
                      <div className="flex items-center gap-3">
                        {flag.status === "green" ? (
                          <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" aria-hidden />
                        ) : (
                          <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0" aria-hidden />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{flag.label}</p>
                          <p className="text-sm text-white/60">{flag.detail}</p>
                        </div>
                        <span className={cn(
                          "shrink-0 text-xs font-bold uppercase px-2.5 py-1 rounded-full",
                          flag.status === "green" && "bg-emerald-500/20 text-emerald-300",
                          flag.status === "yellow" && "bg-amber-500/20 text-amber-300",
                        )}>
                          {flag.status}
                        </span>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </StepShell>
          </motion.div>
        )}

        {step === 9 && (
          <motion.div key="r9" {...pageTransition} transition={{ duration: 0.35 }}>
            <StepShell stepIndex={8} onBack={goBack} onNext={goNext} nextLabel="Make the hire">
              <StaggerGrid className="grid sm:grid-cols-3 gap-6">
                {[
                  { icon: TrendingDown, value: ROI_STATS.turnoverReduction, suffix: "%", label: "Estimated reduction in turnover", color: "text-emerald-400" },
                  { icon: ShieldCheck, value: ROI_STATS.badHireReduction, suffix: "%", label: "Estimated reduction in bad hires", color: "text-blue-400" },
                  { icon: Clock, value: ROI_STATS.timeSavedHours, suffix: " hrs", label: "Time saved verifying references", color: "text-violet-400" },
                ].map((item) => (
                  <motion.div key={item.label} variants={staggerItem}>
                    <GlassCard glow hover className="text-center h-full">
                      <item.icon className={cn("mx-auto h-8 w-8 mb-3", item.color)} aria-hidden />
                      <p className={cn("text-4xl font-bold tabular-nums", item.color)}>
                        <AnimatedCounter value={item.value} suffix={item.suffix} />
                      </p>
                      <p className="mt-2 text-sm text-white/60 leading-snug">{item.label}</p>
                    </GlassCard>
                  </motion.div>
                ))}
              </StaggerGrid>
            </StepShell>
          </motion.div>
        )}

        {step === 10 && (
          <motion.div key="r10" {...pageTransition} transition={{ duration: 0.35 }} className="text-center">
            {!hired ? (
              <>
                <ScreenHeader insight={EMPLOYER_STEP_INSIGHTS[9]} />
                <WhyItMatters text={EMPLOYER_STEP_INSIGHTS[9].whyItMatters} />
                <GlassCard glow className="max-w-md mx-auto mt-4">
                  <p className="text-white/70 text-sm">
                    Based on verified peer trust, <strong className="text-white">{selected.name}</strong> is the top candidate for{" "}
                    <strong className="text-white">{EMPLOYER.hiringRole}</strong>.
                  </p>
                  <DemoButton className="mt-6 w-full" size="lg" onClick={handleHire}>
                    Hire {selected.name.split(" ")[0]}
                  </DemoButton>
                </GlassCard>
                <FlowNav onBack={goBack} showBack />
              </>
            ) : (
              <>
                <SuccessPulse>
                  <PartyPopper className="mx-auto h-16 w-16 text-emerald-400" aria-hidden />
                </SuccessPulse>
                <h2 className="text-3xl sm:text-4xl font-bold mt-6">Congratulations!</h2>
                <p className="mt-4 text-white/60 max-w-lg mx-auto leading-relaxed">
                  You just hired using reputation instead of guesswork. {selected.name} starts Monday as {EMPLOYER.hiringRole}.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                  <DemoButton href="/demo/employee" size="lg">See Employee Experience</DemoButton>
                  <DemoButton href="/demo" variant="outline" size="lg">Back to Demo Center</DemoButton>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </DemoShell>
  );
}
