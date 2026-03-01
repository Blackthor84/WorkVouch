"use client";

/**
 * Persistent global admin bar. Admin mode must ALWAYS be visually obvious.
 * Red accent for production; yellow/amber for sandbox. Override banner when production + founder override active.
 * Fixed height (h-14), single row: warning badge + title text + action button, no overlap.
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
    <div
      className={`sticky top-0 z-50 h-14 flex items-center flex-nowrap gap-3 px-4 shadow-md ${barBg} text-white [&_*]:text-white text-sm font-semibold`}
      role="banner"
      aria-label="Admin mode active"
    >
      <span className="flex-shrink-0" aria-hidden>🔒</span>
      {/* Warning badge: sandbox or override, in same row */}
      {isSandbox && (
        <>
          <span className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-bold bg-amber-400 text-black" aria-label="Sandbox mode">
            🧪 SANDBOX
          </span>
          <span className="flex-shrink-0 text-white/90">|</span>
        </>
      )}
      {env === "PRODUCTION" && overrideActive && (
        <>
          <span className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-bold bg-red-800" aria-label="Override active">
            ⚠ OVERRIDE
          </span>
          <span className="flex-shrink-0 text-white/90">|</span>
        </>
      )}
      <span className="flex-shrink-0">ADMIN MODE</span>
      <span className="flex-shrink-0 text-white/90">|</span>
      <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-semibold ${envBadge}`}>
        ENV: {env}
      </span>
      <span className="flex-shrink-0 text-white/90">|</span>
      <span className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-semibold bg-white/20">
        ROLE: {role}
      </span>
      <span className="flex-shrink-0 text-white/90">|</span>
      <span className="truncate max-w-[200px] sm:max-w-[280px] min-w-0" title={email}>
        {email || "—"}
      </span>
      {env === "PRODUCTION" && isFounder && (
        <ProductionOverrideBannerAndTrigger
          overrideActive={overrideActive}
          overrideExpiresAt={overrideExpiresAt}
        />
      )}
    </div>
  );
}
