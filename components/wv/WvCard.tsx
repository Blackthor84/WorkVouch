"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type WvCardProps = {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
  as?: "div" | "button";
  ariaLabel?: string;
};

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export function WvCard({
  children,
  className,
  hover = false,
  glow = false,
  padding = "md",
  onClick,
  as,
  ariaLabel,
}: WvCardProps) {
  const isButton = as === "button" || !!onClick;
  const classes = cn(
    "rounded-2xl border border-wv-border bg-wv-surface backdrop-blur-xl shadow-xl shadow-black/20",
    paddingMap[padding],
    glow && "ring-1 ring-white/10 shadow-blue-500/5",
    hover &&
      "transition-all duration-300 hover:border-wv-border-hover hover:bg-wv-surface-hover hover:shadow-2xl hover:-translate-y-0.5",
    isButton &&
      "cursor-pointer text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wv-brand-blue/40",
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
