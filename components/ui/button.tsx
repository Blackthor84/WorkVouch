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
    "font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center";

  const variants = {
    primary:
      "bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md hover:shadow-lg",
    secondary:
      "bg-white text-[#334155] border border-[#E2E8F0] hover:bg-gray-50",
    ghost:
      "text-[#2563EB] hover:text-[#1D4ED8] hover:bg-blue-50 rounded-lg",
    danger:
      "bg-red-600 hover:bg-red-700 text-white",
    info: "bg-blue-100 hover:bg-blue-200 text-[#1E40AF]",
    outline:
      "bg-transparent text-[#334155] border border-[#E2E8F0] hover:bg-slate-50",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-6 py-3 text-lg",
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
