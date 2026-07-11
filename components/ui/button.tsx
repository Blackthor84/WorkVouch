import { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "info" | "outline";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  asChild?: boolean;
  href?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  asChild,
  href,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-wv-brand-blue/50 focus-visible:ring-offset-2 focus-visible:ring-offset-wv-bg disabled:pointer-events-none disabled:opacity-50";

  const variants = {
    primary:
      "bg-gradient-to-r from-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 hover:scale-[1.02] active:scale-[0.98]",
    secondary:
      "bg-wv-surface text-wv-foreground border border-wv-border hover:bg-wv-surface-hover",
    ghost:
      "text-wv-muted hover:bg-wv-surface hover:text-wv-foreground",
    danger:
      "bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25",
    info:
      "bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25",
    outline:
      "border border-wv-border-hover bg-transparent text-wv-foreground hover:bg-wv-surface",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  const classes = cn(baseStyles, variants[variant], sizes[size], className);

  // If href is provided, render as Link
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
