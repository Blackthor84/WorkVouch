"use client";

/**
 * Persistent global admin bar. Admin mode must ALWAYS be visually obvious.
 * Red accent for production; yellow/amber for sandbox. Override banner when production + founder override active.
 */

import { ProductionOverrideBannerAndTrigger } from "./ProductionOverrideBannerAndTrigger";

interface AdminGlobalBarProps {
  env: "PRODUCTION" | "SANDBOX";
  role: "ADMIN" | "SUPERADMIN";
  email: string;
  isSandbox: boolean;
  overrideActive?: boolean;
  overrideExpiresAt?: string | null;
  isFounder?: boolean;
}

export function AdminGlobalBar({
  env,
  role,
  email,
  isSandbox,
  overrideActive = false,
  overrideExpiresAt = null,
  isFounder = false,
}: AdminGlobalBarProps) {
  const isProd = env === "PRODUCTION" && !isSandbox && !overrideActive;
  const barBg = isProd ? "bg-red-700" : "bg-amber-600";
  const envBadge = isProd ? "bg-red-800" : "bg-amber-500 text-black";

  return (
    <>
      <div
        className={`sticky top-0 z-50 shadow-md ${barBg} text-white [&_*]:text-white px-4 py-2 text-sm font-semibold flex items-center gap-4 flex-wrap`}
        role="banner"
        aria-label="Admin mode active"
      >
        <span className="font-semibold" aria-hidden>🔒</span>
        <span>ADMIN MODE</span>
        <span>|</span>
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${envBadge}`}>
          ENV: {env}
        </span>
        <span>|</span>
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-white/20">
          ROLE: {role}
        </span>
        <span>|</span>
        <span className="truncate max-w-[280px]" title={email}>
          {email || "—"}
        </span>
        {env === "PRODUCTION" && isFounder && (
          <ProductionOverrideBannerAndTrigger
            overrideActive={overrideActive}
            overrideExpiresAt={overrideExpiresAt}
          />
        )}
      </div>
      {isSandbox && (
        <div
          className="sticky top-[42px] z-40 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-black text-sm font-bold shadow"
          role="alert"
          aria-live="polite"
        >
          <span aria-hidden>🧪</span>
          <span>SANDBOX MODE – NOT PRODUCTION</span>
        </div>
      )}
      {env === "PRODUCTION" && overrideActive && (
        <div
          className="sticky top-[42px] z-40 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-bold shadow"
          role="alert"
          aria-live="polite"
        >
          <span aria-hidden>⚠</span>
          <span>PRODUCTION OVERRIDE ACTIVE — MUTATIONS ENABLED</span>
        </div>
      )}
    </>
  );
}
