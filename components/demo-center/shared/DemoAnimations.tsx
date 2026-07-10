"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export function TrustScoreAnimation({ steps }: { steps: number[] }) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const current = steps[index] ?? 0;
  const finalScore = steps[steps.length - 1] ?? 0;
  const progress = finalScore > 0 ? (current / finalScore) * 100 : 0;

  useEffect(() => {
    if (index >= steps.length - 1) return;
    const timer = setTimeout(() => setIndex((i) => i + 1), reduceMotion ? 0 : 450);
    return () => clearTimeout(timer);
  }, [index, steps.length, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) setIndex(steps.length - 1);
  }, [reduceMotion, steps.length]);

  return (
    <div className="flex flex-col items-center py-8" aria-live="polite">
      <p className="text-sm font-medium uppercase tracking-widest text-white/50 mb-6">
        WorkVouch Trust Score
      </p>

      <div className="relative mb-6">
        <svg width={200} height={200} className="-rotate-90" aria-hidden>
          <circle cx={100} cy={100} r={88} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} />
          <motion.circle
            cx={100}
            cy={100}
            r={88}
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 88}
            initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - progress / 100) }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={current}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 1.08 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="text-6xl sm:text-7xl font-bold tabular-nums bg-gradient-to-b from-white to-blue-200 bg-clip-text text-transparent"
            >
              {current}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-4" aria-hidden>
        {steps.map((s, i) => (
          <motion.span
            key={s}
            initial={{ opacity: 0.3, scale: 0.9 }}
            animate={{
              opacity: i <= index ? 1 : 0.25,
              scale: i === index ? 1.05 : 1,
            }}
            className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-md ${
              i <= index ? "bg-emerald-500/20 text-emerald-300" : "text-white/30"
            }`}
          >
            {s}
          </motion.span>
        ))}
      </div>

      {index >= steps.length - 1 && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-emerald-400 text-sm font-medium text-center max-w-xs"
        >
          Verified by 14 coworkers across 3 employers
        </motion.p>
      )}
    </div>
  );
}

export function Confetti() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#3b82f6"][i % 5],
    size: 6 + Math.random() * 8,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: -20,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{
            y: "110vh",
            opacity: [1, 1, 0],
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
          }}
          transition={{
            duration: 2.5 + Math.random(),
            delay: p.delay,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}

export function LoadingDots({ label = "Searching" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8" role="status" aria-live="polite">
      <div className="relative h-16 w-16">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-blue-500/30"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-t-violet-500 border-r-transparent border-b-transparent border-l-transparent"
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
        />
      </div>
      <div className="flex items-center gap-2 text-white/60">
        <span>{label}</span>
        <span className="flex gap-1" aria-hidden>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-blue-400"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

export function HeroIllustration() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative w-full max-w-lg mx-auto aspect-square" aria-hidden>
      <motion.div
        className="absolute inset-8 rounded-3xl bg-gradient-to-br from-blue-500/20 to-violet-600/20 border border-white/10 backdrop-blur-xl"
        animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-12 left-12 right-12 h-32 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md p-4 shadow-xl"
        animate={reduceMotion ? undefined : { y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-3/4 rounded bg-white/20" />
            <div className="h-2 w-1/2 rounded bg-white/10" />
          </div>
          <motion.div
            className="text-2xl font-bold text-emerald-400 tabular-nums"
            animate={reduceMotion ? undefined : { scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            92
          </motion.div>
        </div>
      </motion.div>
      <motion.div
        className="absolute bottom-16 left-8 w-40 h-24 rounded-xl bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-md"
        animate={reduceMotion ? undefined : { x: [0, 4, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-8 w-36 h-28 rounded-xl bg-violet-500/20 border border-violet-500/30 backdrop-blur-md"
        animate={reduceMotion ? undefined : { x: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut", delay: 0.5 }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-blue-500/40"
          animate={reduceMotion ? undefined : { scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <span className="text-3xl font-bold">WV</span>
        </motion.div>
      </div>
    </div>
  );
}

export function SuccessPulse({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
    >
      <motion.div
        animate={{ boxShadow: ["0 0 0 0 rgba(16,185,129,0.4)", "0 0 0 20px rgba(16,185,129,0)"] }}
        transition={{ repeat: 2, duration: 1.2 }}
        className="rounded-full inline-flex"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
