"use client";

import Link from "next/link";
import Image from "next/image";

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
  const sizeClasses = {
    sm: "h-8 w-auto",
    md: "h-10 w-auto",
    lg: "h-12 w-auto",
    xl: "h-40 w-auto max-w-[560px]",
    "2xl": "h-32 w-auto max-w-[400px]",
    hero: "h-[1152px] w-auto max-w-[16128px]",
  };

  return (
    <Link href="/" className={`flex items-center ${className}`}>
      <div className={`relative ${sizeClasses[size]} flex-shrink-0`}>
        <Image
          src="/images/workvouch-logo.png.png"
          alt="WorkVouch Logo"
          width={300}
          height={100}
          className="h-full w-auto mix-blend-multiply dark:mix-blend-screen"
          priority
          style={{
            objectFit: "contain",
            backgroundColor: "transparent",
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))",
          }}
        />
      </div>
      {showText && (
        <span className="ml-3 text-2xl font-bold bg-gradient-to-br from-blue-600 to-green-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-green-400">
          WorkVouch
        </span>
      )}
    </Link>
  );
}
