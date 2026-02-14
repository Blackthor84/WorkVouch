"use client";

/**
 * Persistent global admin bar. Admin mode must ALWAYS be visually obvious.
 * Red accent for production; yellow/amber for sandbox. Never rely on UI-only checks.
 */

interface AdminGlobalBarProps {
  env: "PRODUCTION" | "SANDBOX";
  role: "ADMIN" | "SUPERADMIN";
  email: string;
  isSandbox: boolean;
}

export function AdminGlobalBar({ env, role, email, isSandbox }: AdminGlobalBarProps) {
  const isProd = env === "PRODUCTION" && !isSandbox;
  const barBg = isProd ? "bg-red-700" : "bg-amber-600";
  const barText = "text-white";
  const envBadge = isProd ? "bg-red-800" : "bg-amber-500 text-black";

  return (
    <>
      <div
        className={`sticky top-0 z-50 flex items-center justify-between gap-4 px-4 py-2 ${barBg} ${barText} text-sm font-medium shadow-md`}
        role="banner"
        aria-label="Admin mode active"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-semibold" aria-hidden>🔒</span>
          <span className="uppercase tracking-wider">ADMIN MODE</span>
          <span className="text-white/80">|</span>
          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${envBadge}`}>
            ENV: {env}
          </span>
          <span className="text-white/80">|</span>
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-white/20">
            ROLE: {role}
          </span>
          <span className="text-white/80">|</span>
          <span className="truncate max-w-[280px]" title={email}>
            {email || "—"}
          </span>
        </div>
      </div>
      {isSandbox && (
        <div
          className="sticky top-[42px] z-40 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-black text-sm font-bold shadow"
          role="alert"
          aria-live="polite"
        >
          <span aria-hidden>🧪</span>
          <span>SANDBOX MODE — NO PRODUCTION DATA WILL BE AFFECTED</span>
        </div>
      )}
    </>
  );
}
