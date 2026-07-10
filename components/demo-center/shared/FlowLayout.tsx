"use client";

import { useId, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepInsight } from "@/lib/demo/demo-center-data";

/** Accessible feature tooltip — keyboard + hover. */
export function FeatureTooltip({
  label,
  body,
  className,
}: {
  label: string;
  body: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span className={cn("relative inline-flex items-center", className)}>
      <button
        type="button"
        aria-label={`Learn about ${label}`}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-blue-400/80 hover:text-blue-300 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <HelpCircle className="h-3.5 w-3.5" aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            id={id}
            role="tooltip"
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-xl border border-white/15 bg-[#12121a]/95 backdrop-blur-xl p-3 text-left shadow-2xl shadow-black/40"
          >
            <span className="block text-xs font-bold text-white">{label}</span>
            <span className="mt-1 block text-xs leading-relaxed text-white/65">{body}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export function FeatureLabel({
  label,
  tooltip,
}: {
  label: string;
  tooltip: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      <FeatureTooltip label={label} body={tooltip} />
    </span>
  );
}

/** Screen header with consistent typography + optional feature tooltip. */
export function ScreenHeader({ insight }: { insight: StepInsight }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mb-8"
    >
      {insight.eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400/90 mb-2">
          {insight.eyebrow}
        </p>
      )}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
        {insight.featureLabel && insight.featureTooltip ? (
          <FeatureLabel label={insight.title} tooltip={insight.featureTooltip} />
        ) : (
          insight.title
        )}
      </h1>
      <p className="mt-2 text-base text-white/55 max-w-2xl leading-relaxed">{insight.subtitle}</p>
    </motion.header>
  );
}

/** "Why this matters" callout on every screen. */
export function WhyItMatters({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.35 }}
      className="mb-8 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 via-violet-500/5 to-transparent p-4 sm:p-5"
    >
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/20">
          <Lightbulb className="h-4 w-4 text-blue-300" aria-hidden />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-300/90">Why this matters</p>
          <p className="mt-1 text-sm text-white/75 leading-relaxed">{text}</p>
        </div>
      </div>
    </motion.div>
  );
}

/** Consistent back / next navigation footer. */
export function FlowNav({
  onBack,
  onNext,
  nextLabel = "Continue",
  backLabel = "Back",
  nextDisabled = false,
  showBack = true,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
}) {
  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      aria-label="Demo step navigation"
      className="mt-10 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 border-t border-white/5"
    >
      {showBack && onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          ← {backLabel}
        </button>
      ) : (
        <span />
      )}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none disabled:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50"
        >
          {nextLabel} →
        </button>
      )}
    </motion.nav>
  );
}

/** Stagger children animation wrapper. */
export function StaggerGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

export const pageTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};
