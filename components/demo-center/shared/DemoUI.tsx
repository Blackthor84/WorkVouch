"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
  as?: "div" | "button";
  ariaLabel?: string;
};

export function GlassCard({
  children,
  className,
  hover = false,
  glow = false,
  onClick,
  as,
  ariaLabel,
}: GlassCardProps) {
  const isButton = as === "button" || !!onClick;
  const classes = cn(
    "rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-5 sm:p-6 shadow-xl shadow-black/20",
    glow && "ring-1 ring-white/10 shadow-blue-500/5",
    hover &&
      "transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:-translate-y-0.5",
    isButton && "cursor-pointer text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40",
    className,
  );

  if (isButton) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        whileTap={{ scale: 0.985 }}
        className={classes}
      >
        {children}
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={classes}
    >
      {children}
    </motion.div>
  );
}

export function DemoButton({
  children,
  onClick,
  href,
  variant = "primary",
  size = "md",
  className,
  disabled,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f] disabled:opacity-40 disabled:pointer-events-none";
  const variants = {
    primary:
      "bg-gradient-to-r from-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]",
    secondary:
      "bg-white/10 text-white border border-white/20 hover:bg-white/15 active:scale-[0.98]",
    ghost: "text-white/70 hover:text-white hover:bg-white/5",
    outline: "border border-white/30 text-white hover:bg-white/10 active:scale-[0.98]",
  };
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base",
  };

  const cls = cn(base, variants[variant], sizes[size], className);

  if (href) {
    return (
      <Link href={href} className={cls} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={cls}
    >
      {children}
    </motion.button>
  );
}

export function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span
      className="inline-flex gap-0.5 text-amber-400"
      role="img"
      aria-label={`${value} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: i < value ? 1 : 0.2, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          aria-hidden
        >
          ★
        </motion.span>
      ))}
    </span>
  );
}

export function SkillBar({
  label,
  score,
  color = "from-blue-500 to-violet-500",
  delay = 0,
}: {
  label: string;
  score: number;
  color?: string;
  delay?: number;
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(score), 100 + delay);
    return () => clearTimeout(t);
  }, [score, delay]);

  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-white/70">{label}</span>
        <span className="font-semibold tabular-nums">{score}</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${score} out of 100`}
      >
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", color)}
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: delay / 1000 }}
        />
      </div>
    </div>
  );
}

export function AnimatedCounter({
  value,
  suffix = "",
  duration = 1200,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return (
    <span className="tabular-nums" aria-live="polite">
      {display}
      {suffix}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%]",
        className,
      )}
      aria-hidden
    />
  );
}
