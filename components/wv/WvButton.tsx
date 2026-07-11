"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type WvButtonProps = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
};

export function WvButton({
  children,
  href,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  className,
  disabled,
  ariaLabel,
}: WvButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wv-brand-blue/50 focus-visible:ring-offset-2 focus-visible:ring-offset-wv-bg disabled:opacity-40 disabled:pointer-events-none";

  const variants = {
    primary:
      "bg-gradient-to-r from-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]",
    secondary:
      "bg-wv-surface text-wv-foreground border border-wv-border hover:bg-wv-surface-hover active:scale-[0.98]",
    ghost: "text-wv-muted hover:text-wv-foreground hover:bg-wv-surface",
    outline: "border border-wv-border-hover text-wv-foreground hover:bg-wv-surface active:scale-[0.98]",
    danger:
      "bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 active:scale-[0.98]",
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
      type={type}
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
