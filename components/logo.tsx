"use client";

import Link from "next/link";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "hero";
}

export function Logo({
  className = "",
  showText = false,
  size = "xl",
}: LogoProps) {
  const textSizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
    "2xl": "text-5xl",
    hero: "text-6xl",
  };

  return (
    <Link href="/" className={`flex items-center ${className}`}>
      <span
        className={`font-bold ${textSizes[size]} bg-gradient-to-br from-blue-600 to-green-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-green-400`}
      >
        WorkVouch
      </span>
    </Link>
  );
}
