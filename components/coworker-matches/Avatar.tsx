"use client";

import { cn } from "@/lib/utils";

type Props = {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-9 w-9 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-14 w-14 text-lg",
};

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}

export function Avatar({ src, name, size = "md", className }: Props) {
  const sizeClass = sizeClasses[size];

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn(
          "rounded-full object-cover bg-wv-surface ring-1 ring-wv-border shrink-0",
          sizeClass,
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br from-blue-500/20 to-violet-600/20 flex items-center justify-center shrink-0 font-semibold text-blue-300 ring-1 ring-wv-border",
        sizeClass,
        className
      )}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  );
}
