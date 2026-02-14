"use client";

/**
 * Sandbox badge for destructive buttons. Makes sandbox mode impossible to confuse with prod.
 * Use on suspend, disable, remove review, etc. when in sandbox mode.
 */

interface SandboxBadgeProps {
  /** When true, show the sandbox badge (e.g. on destructive action in sandbox mode). */
  show: boolean;
  children: React.ReactNode;
  className?: string;
}

export function SandboxBadge({ show, children, className = "" }: SandboxBadgeProps) {
  if (!show) return <>{children}</>;
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className="rounded px-1.5 py-0.5 text-xs font-semibold bg-amber-500 text-black"
        title="This action will run in sandbox; no production data affected"
      >
        🧪 Sandbox
      </span>
      {children}
    </span>
  );
}
