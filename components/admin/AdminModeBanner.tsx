"use client";

/**
 * Red Admin Mode strip + Sandbox/Production badge + logged-in admin identity.
 * WHY: Admin UI must clearly show Admin Mode and whether actions affect production.
 */

interface AdminModeBannerProps {
  isSandbox: boolean;
  email: string;
  isSuperAdmin: boolean;
}

export function AdminModeBanner({ isSandbox, email, isSuperAdmin }: AdminModeBannerProps) {
  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-2 bg-red-600 text-white text-sm font-medium"
      role="banner"
      aria-label="Admin mode active"
    >
      <div className="flex items-center gap-3">
        <span className="uppercase tracking-wider">Admin Mode</span>
        <span
          className={`px-2 py-0.5 rounded text-xs font-semibold ${
            isSandbox ? "bg-amber-500 text-black" : "bg-white/20"
          }`}
        >
          {isSandbox ? "Sandbox" : "Production"}
        </span>
        {isSuperAdmin && (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-800">
            Superadmin
          </span>
        )}
      </div>
      <div className="truncate max-w-[240px]" title={email}>
        {email || "—"}
      </div>
    </div>
  );
}
